import readingTime from 'reading-time';
import { defineDocumentType, makeSource } from 'contentlayer/source-files';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCodeTitles from 'rehype-code-titles';
import rehypePrism from 'rehype-prism-plus';
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';

let totalWords = 0;

const handleTotalWordsCount = (count: number) => {
  let result = String(count);
  if (count > 9999) {
    result = Math.round(count / 1000) + 'k'; // > 9999 => 11k
  } else if (count > 999) {
    result = Math.round(count / 100) / 10 + 'k'; // > 999 => 1.1k
  } // < 999 => 111
  return result;
};

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `**/*.md`,
  fields: {
    title: {
      type: 'string',
      description: '标题',
      required: true
    },
    slug: {
      type: 'string'
    },
    date: {
      type: 'date',
      description: '创建日期',
      required: true
    },
    tags: {
      type: 'string',
      description: '标签',
      required: true
    },
    categories: {
      type: 'list',
      of: { type: 'string' },
      description: '标签',
      required: true
    }
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: doc => doc._raw.sourceFileName.replace(/\.md/, '')
    },
    readingTime: {
      type: 'json',
      resolve: doc => readingTime(doc.body.raw)
    },
    brief: {
      type: 'string',
      resolve: doc => `${doc.body.html.replace(/<[^>]+>/g, '').substring(0, 150)}...`
    },
    totalWords: {
      type: 'string',
      resolve: doc => {
        const { words } = readingTime(doc.body.raw);
        totalWords += words;
        return handleTotalWordsCount(totalWords);
      }
    }
  }
}));

// Raw HTML embeds (e.g. a YouTube <iframe> in a post) were silently dropped
// from body.html. Root cause, verified against contentlayer 0.3.4's source:
// body.html is built by core/markdownToHtml with the `markdown` options —
// NOT the `mdx` options (those only feed body.code, which this template
// never renders). With no `markdown` options set, the pipeline is plain
// remark-parse -> remark-rehype (no allowDangerousHtml) -> stringify, and
// remark-rehype drops raw `html` nodes by default, so a post whose body is
// only an iframe rendered as empty. Fix: supply the `markdown` pipeline as
// a unified-builder callback (the form contentlayer's types allow),
// replicating the default pipeline but with allowDangerousHtml + rehype-raw
// so raw HTML passes through into real elements. No remark/rehype plugins
// are added, so rendering of all existing posts is otherwise unchanged.
const markdownPipeline = (builder: any) => {
  builder
    .use(remarkFrontmatter)
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);
};

export default makeSource({
  contentDirPath: 'posts',
  documentTypes: [Post],
  markdown: markdownPipeline,
  mdx: {
    remarkPlugins: [remarkGfm, remarkToc],
    rehypePlugins: [rehypeSlug, rehypeCodeTitles, rehypePrism, rehypeAutolinkHeadings, rehypeAccessibleEmojis]
  }
});
