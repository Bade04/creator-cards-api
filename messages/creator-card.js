module.exports = {
  // Success
  CREATED: 'Creator Card Created Successfully.',
  RETRIEVED: 'Creator Card Retrieved Successfully.',
  DELETED: 'Creator Card Deleted Successfully.',

  // Business rule errors
  SLUG_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private',
  ACCESS_CODE_NOT_ALLOWED: 'access_code can only be set on private cards',
  NOT_FOUND: 'Creator card not found',
  CARD_IS_DRAFT: 'Creator card not found',
  CARD_IS_PRIVATE: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',
};
