/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const livePosts = require('../_filters/live-posts');
const removeMarkdown = require('remove-markdown');

module.exports = (collection) => {
  const validTags = ['post', 'pathItem'];
  const eleventyPosts = collection
    .getAll()
    .filter((item) => {
      // nb. There's no easy 'getFilteredByMultipleTag' method in Eleventy.
      if (!Array.isArray(item.data.tags)) {
        return false;
      }
      return item.data.tags.some((tag) => validTags.includes(tag));
    })
    .filter((item) => {
      return item.data.title && item.data.page.url;
    })
    .filter(livePosts);

  // For now, hard-code language to English.
  const lang = 'en';

  // Convert 11ty-posts to a flat, indexable format.
  return eleventyPosts.map(({data, template}) => {
    const fulltext = removeMarkdown(template.frontMatter.content);
    return {
      objectID: data.page.url + '#' + lang,
      lang,
      title: data.title,
      description: data.description,
      fulltext,
      _tags: data.tags,
    };
  });
};
