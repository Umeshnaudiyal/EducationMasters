const fs = require('fs');
const readline = require('readline');
const path = require('path');

const sqlFilePath = 'D:\\EducationMasters\\bookmziw_edums (1).sql';

async function analyzeSQL() {
  const fileStream = fs.createReadStream(sqlFilePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const tables = {};
  let currentTable = null;
  let inCreateTable = false;

  for await (const line of rl) {
    const trimmed = line.trim();

    // Check for CREATE TABLE
    const createMatch = trimmed.match(/^CREATE TABLE `?([a-zA-Z0-9_]+)`?\s*\(/i);
    if (createMatch) {
      currentTable = createMatch[1];
      tables[currentTable] = {
        name: currentTable,
        columns: [],
        insertCount: 0
      };
      inCreateTable = true;
      continue;
    }

    if (inCreateTable) {
      if (trimmed.startsWith(') ENGINE=') || trimmed.startsWith(');')) {
        inCreateTable = false;
        currentTable = null;
      } else {
        // Extract column name
        const colMatch = trimmed.match(/^`([a-zA-Z0-9_]+)`\s+([a-zA-Z0-9_\(\)]+)/);
        if (colMatch && currentTable && tables[currentTable]) {
          tables[currentTable].columns.push({
            name: colMatch[1],
            type: colMatch[2],
            raw: trimmed
          });
        }
      }
    }

    // Check for INSERT INTO
    const insertMatch = trimmed.match(/^INSERT INTO `?([a-zA-Z0-9_]+)`?/i);
    if (insertMatch) {
      const tableName = insertMatch[1];
      if (tables[tableName]) {
        // Simple estimate of rows inserted per INSERT line
        // SQL dumps often put multiple rows in one INSERT statement, e.g. VALUES (...), (...), (...)
        // Count occurrences of "),(" or count starting "("
        const valuesPart = trimmed.substring(trimmed.indexOf('VALUES'));
        const tupleMatches = (valuesPart.match(/\),\(|\),\s*\(/g) || []).length + 1;
        tables[tableName].insertCount += tupleMatches;
      }
    }
  }

  console.log('=== SQL DATABASE ANALYSIS RESULT ===');
  console.log(`Total Tables Found: ${Object.keys(tables).length}\n`);

  for (const [tName, meta] of Object.entries(tables)) {
    console.log(`Table: ${tName}`);
    console.log(`  Columns (${meta.columns.length}): ${meta.columns.map(c => `${c.name} (${c.type})`).join(', ')}`);
    console.log(`  Est. Records: ~${meta.insertCount}`);
    console.log('----------------------------------------------------');
  }

  // Also output to json summary file
  fs.writeFileSync('D:\\EducationMasters\\backend\\scripts\\sql_analysis.json', JSON.stringify(tables, null, 2));
  console.log('\nAnalysis saved to D:\\EducationMasters\\backend\\scripts\\sql_analysis.json');
}

analyzeSQL().catch(err => console.error(err));
