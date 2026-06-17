const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { serializeCard } = require('./helpers');

const deleteCardSpec = `root {
  creator_reference string<length:20>
}`;

const parsedDeleteCardSpec = validator.parse(deleteCardSpec);

async function deleteCreatorCard({ slug, body }) {
  // 1. Field-level validation
  validator.validate(body, parsedDeleteCardSpec);

  // 2. Find the card — must exist and not already be deleted
  const card = await creatorCardRepository.findOne({
    query: { slug, deleted: null },
    options: { lean: true },
  });

  if (!card) {
    throwAppError(CreatorCardMessages.NOT_FOUND, 'NF01');
  }

  if (body.creator_reference !== card.creator_reference) {
    throwAppError(CreatorCardMessages.NOT_FOUND, 'NF01');
  }

  // 3. Soft-delete: set deleted = now, updated = now
  const now = Date.now();
  await creatorCardRepository.updateOne({
    query: { slug, deleted: null },
    updateValues: { deleted: now, updated: now },
  });

  // 4. Return the deleted card in creation format (with access_code)
  const deletedCard = { ...card, deleted: now, updated: now };
  return serializeCard(deletedCard, true);
}

module.exports = deleteCreatorCard;
