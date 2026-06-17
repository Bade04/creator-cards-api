/**
 * Serialize a MongoDB CreatorCard document into the API response shape.
 * @param {Object} doc - Raw MongoDB document
 * @param {boolean} includeAccessCode - Whether to include access_code in the output
 */
function serializeCard(doc, includeAccessCode = false) {
  const card = {
    id: doc._id,
    title: doc.title,
    description: doc.description ?? null,
    slug: doc.slug,
    creator_reference: doc.creator_reference,
    links: doc.links ?? [],
    service_rates: doc.service_rates ?? null,
    status: doc.status,
    access_type: doc.access_type,
    created: doc.created,
    updated: doc.updated,
    deleted: doc.deleted ?? null,
  };

  if (includeAccessCode) {
    card.access_code = doc.access_code ?? null;
  }

  return card;
}

/**
 * Auto-generate a slug from a title.
 * @param {string} title
 * @returns {string}
 */
function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '');
}

/**
 * Generate a random 6-character alphanumeric suffix.
 * @returns {string}
 */
function randomSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = { serializeCard, slugifyTitle, randomSuffix };
