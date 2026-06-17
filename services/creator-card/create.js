const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { serializeCard, slugifyTitle, randomSuffix } = require('./helpers');

// VSL spec handles field types, required fields, lengths, and enums.
// Each constraint needs its own <> block in VSL.
const createCardSpec = `root {
  title string<minlength:3><maxlength:100>
  description? string<maxlength:500>
  slug? string<minlength:5><maxlength:50>
  creator_reference string<length:20>
  links[]? {
    title string<minlength:1><maxlength:100>
    url string<maxlength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<minlength:3><maxlength:100>
      description? string<maxlength:250>
      amount number
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

async function createCreatorCard(serviceData) {
  // 1. Field-level validation via VSL (handles types, required, lengths, enums)
  validator.validate(serviceData, parsedCreateCardSpec);

  // Work directly from serviceData (VSL strips keys, so we read from original)
  const {
    title,
    description = null,
    slug: providedSlug,
    creator_reference,
    links = [],
    service_rates = null,
    status,
    access_type = 'public',
    access_code,
  } = serviceData;

  // 2. Business rule: access_code / access_type consistency
  if (access_type === 'private' && !access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, 'AC01');
  }

  if (
    (access_type === 'public' || !access_type) &&
    access_code !== undefined &&
    access_code !== null
  ) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, 'AC05');
  }

  // 3. Business rule: access_code must be exactly 6 alphanumeric chars
  if (access_code) {
    if (!/^[a-zA-Z0-9]{6}$/.test(access_code)) {
      throwAppError('access_code must be exactly 6 alphanumeric characters', 'AC01');
    }
  }

  // 4. service_rates: if present, rates must be non-empty, amounts must be positive integers
  if (service_rates) {
    if (!Array.isArray(service_rates.rates) || service_rates.rates.length === 0) {
      throwAppError('service_rates.rates must be a non-empty array', 'SPCL_VALIDATION');
    }
    for (const rate of service_rates.rates) {
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError(
          'service_rates.rates[].amount must be a positive integer (no decimals, no negatives, no zero)',
          'SPCL_VALIDATION'
        );
      }
    }
  }

  // 5. links: validate URLs start with http:// or https://
  if (links && links.length > 0) {
    for (const link of links) {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError('Link URL must start with http:// or https://', 'SPCL_VALIDATION');
      }
    }
  }

  // 6. Slug handling
  let finalSlug;

  if (providedSlug) {
    // Validate slug format: letters, numbers, hyphens, underscores only
    if (!/^[a-zA-Z0-9\-_]+$/.test(providedSlug)) {
      throwAppError(
        'Slug may only contain letters, numbers, hyphens (-) and underscores (_)',
        'SPCL_VALIDATION'
      );
    }
    // Check uniqueness — deleted cards don't block slug reuse
    const existing = await creatorCardRepository.findOne({
      query: { slug: providedSlug },
    });
    if (existing) {
      throwAppError(CreatorCardMessages.SLUG_TAKEN, 'SL02');
    }
    finalSlug = providedSlug;
  } else {
    // Auto-generate from title
    let candidate = slugifyTitle(title);

    // If too short after cleaning, or already taken, append suffix
    if (candidate.length < 5) {
      candidate = `${candidate}-${randomSuffix()}`;
    } else {
      const existing = await creatorCardRepository.findOne({
        query: { slug: candidate },
      });
      if (existing) {
        candidate = `${candidate}-${randomSuffix()}`;
      }
    }

    finalSlug = candidate;
  }

  // 7. Persist to DB
  const now = Date.now();
  const cardData = {
    title,
    description: description ?? null,
    slug: finalSlug,
    creator_reference,
    links: links || [],
    service_rates: service_rates || null,
    status,
    access_type: access_type || 'public',
    access_code: access_type === 'private' ? access_code : null,
    created: now,
    updated: now,
    deleted: null,
  };

  const created = await creatorCardRepository.create(cardData);

  return serializeCard(created, true);
}

module.exports = createCreatorCard;
