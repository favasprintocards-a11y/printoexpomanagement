import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../api/axios';
import Icon from './Icons';
import ConfirmDialog from './ConfirmDialog';

export default function VisitorTable({ entries, user, onDelete, onDeleteMultiple, selectedExpo }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterExpo, setFilterExpo] = useState('All');
  const [expos, setExpos] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  // Selection & Bulk delete states
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const isAdmin = user.role === 'Admin';

  useEffect(() => {
    fetchExpos();
  }, []);

  // Clear selections when visible entries filter updates
  useEffect(() => {
    setSelectedIds([]);
  }, [entries, filterType, filterExpo, search]);

  const fetchExpos = async () => {
    try {
      const { data } = await API.get('/expos');
      setExpos(data);
    } catch (err) {
      console.error('Failed to fetch expos for filtering:', err);
    }
  };

  const visibleEntries = useMemo(() => {
    // Always hard-filter by selectedExpo first if provided
    let list = selectedExpo
      ? entries.filter((e) => e.expoName === selectedExpo)
      : [...entries];
    if (filterType !== 'All') {
      list = list.filter((e) => e.type === filterType);
    }
    if (!selectedExpo && filterExpo !== 'All') {
      list = list.filter((e) => e.expoName === filterExpo);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (e) => e.personName.toLowerCase().includes(s) || e.companyName.toLowerCase().includes(s)
      );
    }
    return list;
  }, [entries, filterType, filterExpo, search, selectedExpo]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(visibleEntries.map((entry) => entry._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    onDeleteMultiple(selectedIds);
    setSelectedIds([]);
    setShowBulkConfirm(false);
  };

  const exportExcel = () => {
    const data = visibleEntries.map((e, i) => ({
      '#': i + 1,
      'Name': e.personName,
      'Type': e.type,
      'Company': e.companyName,
      'Mobile': e.mobile,
      'Location': e.location || '',
      'Expo': e.expoName || '',
      'Date & Time': new Date(e.dateTime).toLocaleString('en-IN'),
      ...(isAdmin ? { 'Added By': e.addedBy?.displayName || e.addedBy?.username || '' } : {})
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    /* column widths */
    ws['!cols'] = [
      { wch: 4 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, ...(isAdmin ? [{ wch: 12 }] : [])
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitors');
    const today = new Date().toISOString().slice(0, 10);
    const expoSlug = filterExpo === 'All' ? 'all' : filterExpo.replace(/\s+/g, '_');
    XLSX.writeFile(wb, `visitors_export_${expoSlug}_${today}.xlsx`);
  };

  const handleDelete = (id) => setConfirmId(id);
  const confirmDelete = () => {
    onDelete(confirmId);
    setConfirmId(null);
  };

  const typeBadge = (type) =>
    type === 'Reseller'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {isAdmin ? 'All Visitor Records' : 'My Visitor Records'}
            </h2>
            <p className="text-xs text-gray-400">{visibleEntries.length} {visibleEntries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Delete Button */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-650 transition-all duration-300 hover:shadow-lg mr-2"
              >
                <Icon.Trash className="w-4 h-4" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}

            {/* Search */}
            <div className="relative">
              <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white w-48 transition-all"
                placeholder="Search name / company"
              />
            </div>

            {/* Expo filter dropdown — hidden when expo is pre-selected */}
            {!selectedExpo && (
              <div className="relative">
                <select
                  id="filter-expo-select"
                  value={filterExpo}
                  onChange={(e) => setFilterExpo(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-600 transition-all font-medium"
                >
                  <option value="All">All Expos</option>
                  {expos.map((expo) => (
                    <option key={expo._id} value={expo.name}>
                      {expo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter type toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
              {['All', 'Reseller', 'Customer'].map((t) => (
                <button key={t} type="button" onClick={() => setFilterType(t)}
                  className={`px-3 py-2 text-xs font-semibold transition-all duration-200 ${filterType === t
                    ? 'bg-brand-orange text-white shadow-inner'
                    : 'text-gray-500 hover:bg-gray-100'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Excel export */}
            <button
              id="export-excel"
              type="button"
              onClick={exportExcel}
              disabled={visibleEntries.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
            >
              <Icon.Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {visibleEntries.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon.Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No visitor records found</p>
            <p className="text-xs text-gray-300 mt-1">
              {search || filterType !== 'All' || filterExpo !== 'All' ? 'Try adjusting your filters' : 'Add your first visitor above'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                  style={{ background: 'linear-gradient(180deg, #FAFAFA, #F5F5F5)' }}>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={visibleEntries.length > 0 && selectedIds.length === visibleEntries.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange border-gray-300"
                  />
                </th>
                <th className="px-6 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Location</th>
                {!selectedExpo && <th className="px-4 py-3">Expo</th>}
                <th className="px-4 py-3">Date & Time</th>
                {isAdmin && <th className="px-4 py-3">Added By</th>}
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleEntries.map((entry, i) => (
                <tr key={entry._id} className="table-row-hover">
                  <td className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(entry._id)}
                      onChange={() => handleSelectRow(entry._id)}
                      className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{entry.personName}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${typeBadge(entry.type)}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{entry.companyName}</td>
                  <td className="px-4 py-3.5 text-gray-600 font-mono text-xs">{entry.mobile}</td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs">{entry.location}</td>
                  {!selectedExpo && <td className="px-4 py-3.5 text-gray-600 text-xs font-semibold">{entry.expoName}</td>}
                  <td className="px-4 py-3.5 text-gray-505 text-xs whitespace-nowrap">
                    {new Date(entry.dateTime).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {entry.addedBy?.displayName || entry.addedBy?.username || 'Unknown'}
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center">
                    <button type="button" onClick={() => handleDelete(entry._id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      title="Delete entry">
                      <Icon.Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this visitor record? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Bulk delete confirm dialog */}
      {showBulkConfirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${selectedIds.length} selected visitor records? This action cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}
    </div>
  );
}
