// Retire the former staff portal without dropping unrelated appointments or school records.
export function migrateGpsTransport(state) {
  const retired = state.retiredTransport ||= { accounts: [], appointments: [], runs: [], incidents: [] };
  for (const person of state.accounts) {
    const grants = person.grants.filter(grant => grant.role === 'driver');
    if (!grants.length) continue;
    for (const grant of grants) if (!retired.appointments.some(item => item.accountId === person.id && JSON.stringify(item.grant) === JSON.stringify(grant))) retired.appointments.push({ accountId: person.id, grant: { ...grant } });
    if (grants.length === person.grants.length && !retired.accounts.some(item => item.id === person.id)) retired.accounts.push(structuredClone(person));
    person.grants = person.grants.filter(grant => grant.role !== 'driver');
  }
  const archivedIds = new Set(retired.accounts.map(person => person.id));
  state.accounts = state.accounts.filter(person => person.grants.length || !archivedIds.has(person.id));
  for (const [source, destination] of [['driverRuns', 'runs'], ['driverIncidents', 'incidents']]) {
    for (const record of state[source] || []) if (!retired[destination].some(item => item.id === record.id)) retired[destination].push(record);
    delete state[source];
  }
  retired.reports ||= [];
  for (const key of ['coordinatorReports', 'executiveReports', 'principalReports']) {
    if (!Array.isArray(state[key])) continue;
    state[key] = state[key].filter(report => {
      const legacy = (report.customColumns || []).some(column => /driver/i.test(column.join(' '))) || (report.buses || []).some(bus => 'driver' in bus || 'driverId' in bus);
      if (legacy && !retired.reports.some(item => item.collection === key && item.report.id === report.id)) retired.reports.push({ collection: key, report });
      return !legacy;
    });
  }
  for (const bus of state.buses) {
    delete bus.driver; delete bus.driverId;
    if (!state.gpsTransportVersion && !Object.hasOwn(bus, 'trackerId')) bus.trackerId = 'SCN-GPS-' + bus.id;
    if (!Object.hasOwn(bus, 'trackerEnabled')) bus.trackerEnabled = Boolean(bus.trackerId);
    if (!Object.hasOwn(bus, 'trackerStatus')) bus.trackerStatus = bus.status === 'delayed' ? 'offline' : 'online';
  }
  state.gpsTransportVersion = 1;
  return state;
}
