const ROLES = {
  PATIENT: 'patient',
  PROFESSIONAL: 'professional',
  ADMIN: 'admin',
};

const ROLE_HIERARCHY = {
  [ROLES.PATIENT]: 1,
  [ROLES.PROFESSIONAL]: 2,
  [ROLES.ADMIN]: 3,
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
}; 