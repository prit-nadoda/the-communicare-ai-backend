const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3,
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
}; 