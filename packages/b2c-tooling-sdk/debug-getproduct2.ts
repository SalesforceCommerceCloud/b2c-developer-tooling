import { parsePipeline, analyzePipeline } from './src/operations/pipeline/index.js';
import * as fs from 'fs';

const xml = fs.readFileSync('/Users/clavery/code/sitegenesis/app_storefront_pipelines/cartridge/pipelines/Product.xml', 'utf-8');

async function main() {
  const pipeline = await parsePipeline(xml, 'Product');

  // Trace node_22 path
  console.log('=== Tracing node_22 path (error path) ===');
  let currentId: string | undefined = 'node_22';
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = pipeline.nodes.get(currentId);
    if (!node) {
      console.log(`Node ${currentId}: NOT FOUND`);
      break;
    }

    console.log(`\nNode ${currentId}: ${node.type}`);
    if (node.type === 'interaction') {
      console.log('  template:', (node as any).templateName);
    }
    console.log('  transitions:', JSON.stringify(node.transitions, null, 2));

    currentId = node.transitions[0]?.targetId;
  }

  // Check decision node_13 transitions
  console.log('\n=== Decision node_13 analysis ===');
  const decisionNode = pipeline.nodes.get('node_13');
  console.log('Decision transitions:', JSON.stringify(decisionNode?.transitions, null, 2));

  // Check what node_17 is (the other transition from Product.productSet decision)
  console.log('\n=== node_17 (from Product.productSet no path) ===');
  let curr: string | undefined = 'node_17';
  const vis2 = new Set<string>();
  while (curr && !vis2.has(curr)) {
    vis2.add(curr);
    const n = pipeline.nodes.get(curr);
    if (!n) break;
    const transStr = n.transitions.map(t => `-> ${t.targetId} (${t.connector || 'default'})`).join(', ');
    console.log(`${curr}: ${n.type}`, transStr);
    curr = n.transitions[0]?.targetId;
  }
}

main().catch(console.error);
