const normalize = (value) => String(value ?? '').trim().toLowerCase();

export const doesUserMatchCompetitionEligibility = (competition, user) => {
  if (!competition) return false;

  if (!user || user.role !== 'student') {
    return true;
  }

  const profile = user.profile || {};
  const eligibilityMode = competition.eligibilityMode || 'all';

  if (eligibilityMode === 'departmentYearClass') {
    const departmentMatches = !competition.eligibleDepartment || normalize(profile.department) === normalize(competition.eligibleDepartment);
    const classMatches = !competition.eligibleClass || normalize(profile.class) === normalize(competition.eligibleClass);
    return departmentMatches && classMatches;
  }

  if (eligibilityMode === 'domain') {
    const userDomains = Array.isArray(profile.domain)
      ? profile.domain
      : typeof profile.domain === 'string'
        ? profile.domain.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    const eligibleDomains = Array.isArray(competition.eligibleDomains)
      ? competition.eligibleDomains
      : typeof competition.eligibleDomains === 'string'
        ? competition.eligibleDomains.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    if (!eligibleDomains.length) return true;
    const normalizedUserDomains = userDomains.map(normalize);
    return eligibleDomains.some((domain) => normalizedUserDomains.includes(normalize(domain)));
  }

  return true;
};
