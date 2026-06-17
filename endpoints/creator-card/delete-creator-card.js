const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const { deleteCard } = require('@app/services/creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'delete-creator-card-completed');
  },
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const { body } = rc;

    const data = await deleteCard({ slug, body });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.DELETED,
      data,
    };
  },
});
