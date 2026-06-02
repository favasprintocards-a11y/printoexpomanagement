import { useState, useEffect } from 'react';
import API from '../api/axios';
import Icon from './Icons';

export default function VisitorForm({ onSubmit, selectedExpo }) {
  const now = () => {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0') + 'T' +
      String(d.getHours()).padStart(2,'0') + ':' +
      String(d.getMinutes()).padStart(2,'0');
  };

  const empty = { personName: '', type: 'Reseller', companyName: '', mobile: '', location: '', dateTime: now(), expoName: selectedExpo || '', requirement: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(true);

  // Expos states
  const [expos, setExpos] = useState([]);
  const [loadingExpos, setLoadingExpos] = useState(true);

  useEffect(() => {
    fetchExpos();
  }, []);

  const fetchExpos = async () => {
    // Skip fetching if expo is already pre-selected from the selection screen
    if (selectedExpo) { setLoadingExpos(false); return; }
    setLoadingExpos(true);
    try {
      const { data } = await API.get('/expos');
      setExpos(data);
      if (data.length > 0) {
        setForm((f) => ({ ...f, expoName: data[0].name }));
      }
    } catch (err) {
      console.error('Failed to fetch expos:', err);
    } finally {
      setLoadingExpos(false);
    }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.personName.trim()) e.personName = 'Name is required';
// Company optional: no validation
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^\d{7,15}$/.test(form.mobile.trim())) e.mobile = 'Must be numeric (7-15 digits)';
// Location optional: no validation
    if (!form.dateTime) e.dateTime = 'Date & time is required';
    if (!form.expoName || !form.expoName.trim()) e.expoName = 'Expo selection is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    onSubmit({
      ...form,
      personName: form.personName.trim(),
      companyName: form.companyName.trim(),
      mobile: form.mobile.trim(),
      location: form.location.trim(),
      requirement: form.requirement.trim()
    });
    setForm({ ...empty, dateTime: now(), expoName: selectedExpo || expos[0]?.name || '' });
    setErrors({});
  };

  const fieldClass = (key) =>
    `w-full px-4 py-3 rounded-xl border ${errors[key] ? 'border-red-400 bg-red-50/40' : 'border-gray-200 bg-white/80'} text-gray-800 text-sm placeholder-gray-400 transition-all duration-200 hover:border-brand-orange/40`;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 animate-fade-in">
      {/* Toggle header */}
      <button
        id="toggle-form"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center shadow-md shadow-brand-orange/20">
            <Icon.Plus className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-gray-800">New Visitor Entry</h2>
            <p className="text-xs text-gray-400">Add a new visitor record</p>
          </div>
        </div>
        <Icon.ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Person Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Person Name *</label>
              <input id="field-name" value={form.personName} onChange={(e) => set('personName', e.target.value)}
                     className={fieldClass('personName')} placeholder="Full name" />
              {errors.personName && <p className="text-red-500 text-xs mt-1">{errors.personName}</p>}
            </div>

            {/* Expo Name — hidden when pre-selected from Expo Selection Screen */}
            {!selectedExpo && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Expo Name *</label>
                {loadingExpos ? (
                  <div className="text-xs text-gray-400 py-3">Loading expos…</div>
                ) : (
                  <select
                    id="field-exponame"
                    value={form.expoName}
                    onChange={(e) => set('expoName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-800 text-sm placeholder-gray-400 transition-all duration-200 hover:border-brand-orange/40"
                    required
                  >
                    <option value="" disabled>Select an Expo</option>
                    {expos.map((expo) => (
                      <option key={expo._id} value={expo.name}>
                        {expo.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.expoName && <p className="text-red-500 text-xs mt-1">{errors.expoName}</p>}
              </div>
            )}

            {/* Type toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Type *</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {['Reseller', 'Customer'].map((t) => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={`flex-1 py-3 text-sm font-semibold transition-all duration-300 ${form.type === t ? 'toggle-active' : 'toggle-inactive hover:bg-gray-100'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Company Name</label>
              <input id="field-company" value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                     className={fieldClass('companyName')} placeholder="Company name" />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mobile Number *</label>
              <input id="field-mobile" value={form.mobile} onChange={(e) => set('mobile', e.target.value)}
                     className={fieldClass('mobile')} placeholder="Mobile number" inputMode="numeric" />
              {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location</label>
              <input id="field-location" value={form.location} onChange={(e) => set('location', e.target.value)}
                     className={fieldClass('location')} placeholder="City / Area" />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date & Time *</label>
              <input id="field-datetime" type="datetime-local" value={form.dateTime}
                     onChange={(e) => set('dateTime', e.target.value)}
                     className={fieldClass('dateTime')} />
              {errors.dateTime && <p className="text-red-500 text-xs mt-1">{errors.dateTime}</p>}
            </div>

            {/* Requirement */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Requirement</label>
              <textarea
                id="field-requirement"
                value={form.requirement}
                onChange={(e) => set('requirement', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-800 text-sm placeholder-gray-400 transition-all duration-200 hover:border-brand-orange/40 h-20 resize-y"
                placeholder="Details of what the visitor is looking for..."
              />
              {errors.requirement && <p className="text-red-500 text-xs mt-1">{errors.requirement}</p>}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              id="submit-visitor"
              type="submit"
              className="px-8 py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-brand-orange/30 active:scale-[0.97] flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #F26622, #D9551A)' }}
            >
              <Icon.Plus className="w-4 h-4" />
              Add Visitor
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
