import test from 'node:test';
import assert from 'node:assert/strict';
import { doesUserMatchCompetitionEligibility } from '../utils/competitionEligibility.js';

test('allows unrestricted competitions', () => {
  const competition = { eligibilityMode: 'all' };
  const user = { role: 'student', profile: { department: 'CSE', year: '3', class: 'A', domain: ['React'] } };

  assert.equal(doesUserMatchCompetitionEligibility(competition, user), true);
});

test('matches department year and class restrictions', () => {
  const competition = {
    eligibilityMode: 'departmentYearClass',
    eligibleDepartment: 'CSE',
    eligibleClass: 'A'
  };
  const user = { role: 'student', profile: { department: 'CSE', year: '3', class: 'A', domain: ['React'] } };

  assert.equal(doesUserMatchCompetitionEligibility(competition, user), true);
});

test('matches domain restrictions', () => {
  const competition = {
    eligibilityMode: 'domain',
    eligibleDomains: ['React', 'Node']
  };
  const user = { role: 'student', profile: { department: 'CSE', year: '3', class: 'A', domain: ['React'] } };

  assert.equal(doesUserMatchCompetitionEligibility(competition, user), true);
});

test('rejects mismatched eligibility', () => {
  const competition = {
    eligibilityMode: 'departmentYearClass',
    eligibleDepartment: 'IT',
    eligibleClass: 'B'
  };
  const user = { role: 'student', profile: { department: 'CSE', year: '3', class: 'A', domain: ['React'] } };

  assert.equal(doesUserMatchCompetitionEligibility(competition, user), false);
});
