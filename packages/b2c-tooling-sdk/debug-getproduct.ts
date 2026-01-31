import { parsePipeline, analyzePipeline } from './src/operations/pipeline/index.js';
import * as fs from 'fs';

const xml = fs.readFileSync('/Users/clavery/code/sitegenesis/app_storefront_pipelines/cartridge/pipelines/Product.xml', 'utf-8');

async function main() {
  const pipeline = await parsePipeline(xml, 'Product');
  
  // Find GetProduct start node
  let getProductStartId: string | undefined;
  for (const [id, node] of pipeline.nodes) {
    if (node.type === 'start' && node.name === 'GetProduct') {
      getProductStartId = id;
      console.log('GetProduct start node:', id);
      console.log('  transitions:', JSON.stringify(node.transitions, null, 2));
      break;
    }
  }
  
  // Trace the path from GetProduct start
  if (getProductStartId) {
    console.log('\n=== Tracing GetProduct path ===');
    let currentId = getProductStartId;
    const visited = new Set<string>();
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const node = pipeline.nodes.get(currentId);
      if (!node) break;
      
      console.log(`\nNode ${currentId}: ${node.type}`);
      if (node.type === 'decision') {
        console.log('  condition:', (node as any).condition);
      }
      if (node.type === 'pipelet') {
        console.log('  pipeletName:', (node as any).pipeletName);
        console.log('  hasErrorBranch:', (node as any).hasErrorBranch);
      }
      if (node.type === 'interaction') {
        console.log('  template:', (node as any).templateName);
      }
      if (node.type === 'end') {
        console.log('  name:', (node as any).name);
      }
      console.log('  transitions:', JSON.stringify(node.transitions, null, 2));
      
      // Follow first/default transition
      currentId = node.transitions[0]?.targetId;
    }
  }
  
  // Find all interaction nodes with error/notfound
  console.log('\n=== Interaction nodes with error/notfound ===');
  for (const [id, node] of pipeline.nodes) {
    if (node.type === 'interaction' && (node as any).templateName === 'error/notfound') {
      console.log('Found error/notfound:', id);
      // Find what leads to this node
      for (const [srcId, srcNode] of pipeline.nodes) {
        for (const t of srcNode.transitions) {
          if (t.targetId === id) {
            console.log(`  <- from ${srcId} (${srcNode.type})`);
          }
        }
      }
    }
  }
  
  // Run analysis
  console.log('\n=== Analysis ===');
  const analysis = analyzePipeline(pipeline);
  console.log('Total warnings:', analysis.warnings.length);
  for (const w of analysis.warnings) {
    console.log('  ', w);
  }
}

main().catch(console.error);
