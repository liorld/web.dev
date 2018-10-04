/*
 * Copyright 2018 Google LLC
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

'use strict';

const path = require('path');
const templates = require('./templates.js');


async function guidesConfigForPath(loader, webdevPath) {
  // TODO(samthor): hardcoded 'en'
  const guidesYaml = await loader.get(`en/path/${webdevPath}/guides.yaml`);
  if (guidesYaml === null) {
    return [];
  }

  const out = [];
  const config = await guidesYaml.config;
  let count = 0;
  for (const topic of config.topics || []) {
    const title = topic.title;
    const guides = [];

    for (const guide of topic.guides) {
      const guidePage = await loader.get(`${guidesYaml.dir}/${guide}/index.md`);
      if (guidePage === null) {
        continue;
      }

      const config = await guidePage.config;
      guides.push({
        id: guide,
        config,
        title: config && config.title || guide,
      });
    }

    if (guides.length) {
      out.push({title, guides, num: ++count});
    }
  }

  return out;
}


async function AuditGuidePaths(loader, cf) {
  const webdevPaths = {};

  const pathPages = await loader.contents(`${cf.dir}/path/*.md`);
  for (const pathPage of pathPages) {
    const id = pathPage.name;
    const title = (await pathPage.config).title;
    webdevPaths[id] = title;
  }

  const allGuides = [];

  for (const pathId in webdevPaths) {
    // for each path
    const guidesConfig = await guidesConfigForPath(loader, pathId);
    guidesConfig.forEach(({title: category, guides}) => {
      // for each category in the path
      guides.forEach(({id, title, config}) => {
        // for each guide in that category
        allGuides.push({
          id,
          url: `path/${pathId}/${id}`,
          path: webdevPaths[pathId],
          category,
          title,
          lighthouse: config.lighthouse_ids || [],
        });
      });
    });
  }

  return templates('auditguides.md', {guides: allGuides});
}


async function PathIndex(loader, cf) {
  const id = path.basename(cf.dir);
  const guidesConfig = await guidesConfigForPath(loader, id);

  return templates('path-guidelist.md', {categories: guidesConfig});
}


module.exports = {
  AuditGuidePaths,
  PathIndex,
};