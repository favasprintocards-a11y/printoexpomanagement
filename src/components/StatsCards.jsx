import Icon from './Icons';

export default function StatsCards({ entries, selectedExpo }) {
  const filtered = selectedExpo
    ? entries.filter((e) => e.expoName === selectedExpo)
    : entries;

  const total = filtered.length;
  const resellers = filtered.filter((e) => e.type === 'Reseller').length;
  const customers = filtered.filter((e) => e.type === 'Customer').length;

  const cards = [
    { label: 'Total Visitors', value: total, icon: Icon.Users, gradient: 'from-brand-orange to-orange-400', shadow: 'shadow-brand-orange/20' },
    { label: 'Resellers', value: resellers, icon: Icon.User, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
    { label: 'Customers', value: customers, icon: Icon.User, gradient: 'from-brand-lime-dark to-green-500', shadow: 'shadow-green-500/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {cards.map((c, i) => (
        <div key={i}
             className={`relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg ${c.shadow} border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
             style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
              <p className="text-3xl font-extrabold text-gray-800 mt-1">{c.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
              <c.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Decorative accent */}
          <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.06]`}></div>
        </div>
      ))}
    </div>
  );
}
