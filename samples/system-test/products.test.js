/**
 * Copyright 2018, Google, LLC.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const path = require(`path`);
const uuid = require(`uuid`);
const vision = require('@google-cloud/vision');
const productSearch = new vision.ProductSearchClient();
const assert = require('assert');
const tools = require(`@google-cloud/nodejs-repo-tools`);
const cmd = `node products.js`;
const cwd = path.join(__dirname, `..`, `productSearch`);

// Shared fixture data for product tests
const testProduct = {
  projectId: process.env.GCLOUD_PROJECT,
  location: 'us-west1',
  productId: `test_products_id${uuid.v4()}`,
  productDisplayName: 'test_product_display_name_1',
  productCategory: 'homegoods',
  productKey: 'myKey',
  productValue: 'myValue',
};
testProduct.productPath = productSearch.productPath(
  testProduct.projectId,
  testProduct.location,
  testProduct.productId
);
testProduct.createdProductPaths = [];
// Helper function: returns product if exists else false
async function getProductOrFalse(productPath) {
  try {
    const response = await productSearch.getProduct({name: productPath});
    return response[0];
  } catch (err) {
    if (err.message.includes('Not found')) {
      return false;
    }
  }
}

describe(`products`, () => {
  before(tools.checkCredentials);
  before(async () => {
    // Create a test product set for each test
    await productSearch.createProduct({
      parent: productSearch.locationPath(
        testProduct.projectId,
        testProduct.location
      ),
      productId: testProduct.productId,
      product: {
        displayName: testProduct.productDisplayName,
        productCategory: testProduct.productCategory,
      },
    });
    testProduct.createdProductPaths.push(testProduct.productPath);
  });

  after(async () => {
    // Delete products sets after each test
    testProduct.createdProductPaths.forEach(async path => {
      try {
        await productSearch.deleteProduct({name: path});
      } catch (err) {} // ignore error
    });
  });
  it(`should create product`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    assert.strictEqual(await getProductOrFalse(newProductPath), false);

    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));

    const newProduct = await getProductOrFalse(newProductPath);
    assert.ok(newProduct.displayName === testProduct.productDisplayName);
    assert.ok(newProduct.productCategory === testProduct.productCategory);

    output = await tools.runAsync(
      `${cmd} deleteProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );
    assert.ok(output.includes(`Product deleted.`));
  });

  it(`should get product`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    assert.strictEqual(await getProductOrFalse(newProductPath), false);
    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));

    output = await tools.runAsync(
      `${cmd} getProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));
    assert.ok(output.includes(`Product id: ${newProductId}`));
    assert.ok(output.includes(`Product display name:`));
    assert.ok(output.includes(`Product description:`));
    assert.ok(
      output.includes(`Product category: ${testProduct.productCategory}`)
    );
    assert.ok(output.includes(`Product labels:`));

    output = await tools.runAsync(
      `${cmd} deleteProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );
    assert.ok(output.includes(`Product deleted.`));
  });

  it(`should list products`, async () => {
    const output = await tools.runAsync(
      `${cmd} listProducts "${testProduct.projectId}" "${
        testProduct.location
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product id: ${testProduct.productId}`));
    assert.ok(output.includes(`Product labels:`));
  });

  it(`should update product label`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));
    output = await tools.runAsync(
      `${cmd} updateProductLabels "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productKey}" "${
        testProduct.productValue
      }"`,
      cwd
    );

    assert.ok(
      output.includes(
        `Product Labels: ${testProduct.productKey}: ${testProduct.productValue}`
      )
    );
    assert.ok(
      output.includes(`Product display name: ${testProduct.productDisplayName}`)
    );
    assert.ok(output.includes(`Product description:`));
    assert.ok(
      output.includes(`Product category: ${testProduct.productCategory}`)
    );
  });

  it(`should delete product`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    assert.strictEqual(await getProductOrFalse(newProductPath), false);
    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));

    output = await tools.runAsync(
      `${cmd} deleteProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );
    assert.ok(output.includes(`Product deleted.`));

    try {
      await productSearch.getProduct({name: `${newProductPath}`});
      assert.fail('Product was not deleted');
    } catch (err) {
      assert.ok(err.message.includes('Not found'));
    }
  });
});
