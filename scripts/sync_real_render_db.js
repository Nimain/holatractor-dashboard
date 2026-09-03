const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://nimain:DxbBkXHqc0ZvzAZFtRVXRT3vthZ4xYqO@dpg-cv973d5umphs73flh6ug-a.oregon-postgres.render.com/holadata_poaf?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function syncRealData() {
  const client = await pool.connect();
  try {
    // 1. Delete artificial presets
    await client.query('DELETE FROM "Dealer" WHERE id LIKE $1', ['dlr_sc_%']);
    await client.query('DELETE FROM "Operator" WHERE id LIKE $1', ['op_sc_%']);
    await client.query('DELETE FROM "User" WHERE id LIKE $1 OR id LIKE $2', ['usr_dlr_%', 'usr_op_%']);
    await client.query('DELETE FROM "Document" WHERE id LIKE $1', ['doc_op_%']);
    console.log('Cleaned artificial preset rows from Render DB!');

    // 2. Query real DealerStore owners and register them in "Dealer" table
    const dealerStores = await client.query(`
      SELECT DISTINCT ds.owner_id, ds.base_id 
      FROM "DealerStore" ds
      INNER JOIN "User" u ON u.id = ds.owner_id
      WHERE ds.owner_id IS NOT NULL
    `);
    const DEALER_ROLE_ID = 'cm8d2cvhv009sm167p1c89vrs';
    for (const ds of dealerStores.rows) {
      await client.query(`
        INSERT INTO "Dealer" (id, base_id, user_id, role_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [`dlr_${ds.owner_id}`, ds.base_id || 'cm89t43ky00034wft9fiixpc7', ds.owner_id, DEALER_ROLE_ID]);
    }
    console.log(`Synced ${dealerStores.rows.length} real Dealer records from DealerStore!`);

    // 3. Query real hired operators from OperatorInStore who exist in "User" table
    const oisRows = await client.query(`
      SELECT DISTINCT ois.operator_id, ois.base_id
      FROM "OperatorInStore" ois
      INNER JOIN "User" u ON u.id = ois.operator_id
      WHERE ois.operator_id IS NOT NULL
    `);
    const OPERATOR_ROLE_ID = 'cm8d2c7d5009em167zmd08dsj';
    const baseRes = await client.query('SELECT id FROM "Base" LIMIT 1');
    const baseId = baseRes.rows[0]?.id || 'cm89t43ky00034wft9fiixpc7';

    for (const r of oisRows.rows) {
      const uid = r.operator_id;
      const docId = `doc_${uid}`;
      await client.query(`
        INSERT INTO "Document" (id, base_id, document_number, attachment, "createdAt", "updatedAT")
        VALUES ($1, $2, $3, 'https://holadashboard.s3.amazonaws.com/operator-license.pdf', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [docId, baseId, `LIC-${uid.slice(-6)}`]);

      await client.query(`
        INSERT INTO "Operator" (id, base_id, user_id, role_id, document_attachment_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [`op_${uid}`, baseId, uid, OPERATOR_ROLE_ID, docId]);
    }
    console.log(`Synced ${oisRows.rows.length} real Operator records from OperatorInStore into Render DB!`);

    // 4. Verify counts
    const dCount = await client.query('SELECT COUNT(*) FROM "Dealer"');
    const opCount = await client.query('SELECT COUNT(*) FROM "Operator"');
    console.log('Final Real Dealers in Render DB:', dCount.rows[0].count);
    console.log('Final Real Operators in Render DB:', opCount.rows[0].count);
  } finally {
    client.release();
    pool.end();
  }
}

syncRealData().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
