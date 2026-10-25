import algoliasearch from 'algoliasearch';
import config from 'config';
import type { Post } from 'contentlayer/generated';

const {
  thirdParty: { algolia }
} = config;

export const generateIndex = async (posts: Post[]): Promise<void> => {
  const objects = posts.map(post => ({
    objectID: post._id,
    url: `https://laibh.com/${post.slug}`,
    title: post.title,
    tags: post.tags,
    catories: post.categories,
    brief: post.brief,
    slug: post.slug,
    totalWords: post.totalWords,
    readingTime: post.readingTime
  }));
  const client = algoliasearch(algolia.APPLICATION, algolia.SEARCH_ONLY_API_KEY);
  const index = client.initIndex(algolia.ALGOLIA_INDEX);

  if (process.env.NODE_ENV === 'production') {
    // Build must not fail when the search index is unreachable (e.g. the
    // upstream Algolia app/key is invalid or the build host cannot reach
    // Algolia): search is a nice-to-have, the homepage is not. Log and
    // continue instead of failing the prerender of "/".
    try {
      await index.saveObjects(objects, { autoGenerateObjectIDIfNotExist: true });
    } catch (error) {
      console.warn('generateIndex: Algolia indexing failed, continuing without it:', error);
    }
  }
};
