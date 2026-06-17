const { throwAppError } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { serializeCard } = require('./helpers');

async function getCreatorCard({ slug, access_code }) {
  // 1. Find card (including deleted to distinguish NF01 vs NF02)
  const card = await creatorCardRepository.findOne({
    query: { slug },
    options: { lean: true },
  });

  // Rule 1: Card not found at all, OR card is soft-deleted
  if (!card || card.deleted !== null) {
    throwAppError(CreatorCardMessages.NOT_FOUND, 'NF01');
  }

  // Rule 2: Card exists but is a draft
  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.CARD_IS_DRAFT, 'NF02');
  }

  // Rules 3 & 4: Private card access control
  if (card.access_type === 'private') {
    if (!access_code) {
      throwAppError(CreatorCardMessages.CARD_IS_PRIVATE, 'AC03');
    }
    if (access_code !== card.access_code) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, 'AC04');
    }
  }

  // Rule 5: Return card WITHOUT access_code
  return serializeCard(card, false);
}

module.exports = getCreatorCard;
