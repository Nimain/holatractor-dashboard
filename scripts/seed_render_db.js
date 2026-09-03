const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://nimain:DxbBkXHqc0ZvzAZFtRVXRT3vthZ4xYqO@dpg-cv973d5umphs73flh6ug-a.oregon-postgres.render.com/holadata_poaf?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

const DEALER_ROLE_ID = 'cm8d2cvhv009sm167p1c89vrs';
const OPERATOR_ROLE_ID = 'cm8d2c7d5009em167zmd08dsj';

const DEALERS = [
  { id: 'dlr_sc_01', user_id: 'usr_dlr_01', first: 'AgroTech Bolivia', last: 'S.R.L.', email: 'contacto@agrotech.bo', mobile: '77012345' },
  { id: 'dlr_sc_02', user_id: 'usr_dlr_02', first: 'Tractores del Oriente', last: 'S.A.', email: 'ventas@tractororiente.com', mobile: '78564120' },
  { id: 'dlr_sc_03', user_id: 'usr_dlr_03', first: 'Montero Maquinaria', last: 'Agrícola', email: 'info@monteromaq.bo', mobile: '71092834' },
  { id: 'dlr_sc_04', user_id: 'usr_dlr_04', first: 'Gran Chaco', last: 'Agro Equipos', email: 'granchaco@agroequipos.bo', mobile: '76394012' },
  { id: 'dlr_sc_05', user_id: 'usr_dlr_05', first: 'Warnes Tractor', last: 'Center', email: 'warnes@tractorcenter.bo', mobile: '79218402' },
  { id: 'dlr_sc_06', user_id: 'usr_dlr_06', first: 'Caisy Maquinaria', last: 'San Juan', email: 'caisy@sanjuan.bo', mobile: '75482019' },
  { id: 'dlr_sc_07', user_id: 'usr_dlr_07', first: 'Valles Agroindustrial', last: 'S.A.', email: 'valles@agroindustrial.bo', mobile: '72384910' },
  { id: 'dlr_sc_08', user_id: 'usr_dlr_08', first: 'Beni Ganadería', last: 'y Tractores', email: 'beni@ganaderiatractores.bo', mobile: '74102938' },
  { id: 'dlr_sc_09', user_id: 'usr_dlr_09', first: 'Cuatro Cañadas', last: 'AgroServicios', email: 'contacto@4canadas.bo', mobile: '76829104' },
  { id: 'dlr_sc_10', user_id: 'usr_dlr_10', first: 'Pailón Heavy', last: 'Machinery', email: 'pailon@heavymachinery.bo', mobile: '73019284' }
];

const OPERATORS = [
  { id: 'op_sc_01', user_id: 'usr_op_01', first: 'Carlos', last: 'Mendoza Vaca', email: 'carlos.mendoza@holatractor.com', mobile: '76019283' },
  { id: 'op_sc_02', user_id: 'usr_op_02', first: 'Jorge', last: 'Mamani Quispe', email: 'jorge.mamani@holatractor.com', mobile: '77128394' },
  { id: 'op_sc_03', user_id: 'usr_op_03', first: 'Ramiro', last: 'Flores Rojas', email: 'ramiro.flores@holatractor.com', mobile: '78239401' },
  { id: 'op_sc_04', user_id: 'usr_op_04', first: 'Gonzalo', last: 'Justiniano Parada', email: 'gonzalo.justiniano@holatractor.com', mobile: '71349502' },
  { id: 'op_sc_05', user_id: 'usr_op_05', first: 'Victor', last: 'Salvatierra Ortiz', email: 'victor.salvatierra@holatractor.com', mobile: '76450613' },
  { id: 'op_sc_06', user_id: 'usr_op_06', first: 'Mario', last: 'Gutierrez Soliz', email: 'mario.gutierrez@holatractor.com', mobile: '79561724' },
  { id: 'op_sc_07', user_id: 'usr_op_07', first: 'Hugo', last: 'Chavez Torrico', email: 'hugo.chavez@holatractor.com', mobile: '72672835' },
  { id: 'op_sc_08', user_id: 'usr_op_08', first: 'Diego', last: 'Armando Terrazas', email: 'diego.terrazas@holatractor.com', mobile: '73783946' },
  { id: 'op_sc_09', user_id: 'usr_op_09', first: 'Julio', last: 'Cesar Peinado Melgar', email: 'julio.peinado@holatractor.com', mobile: '74894057' },
  { id: 'op_sc_10', user_id: 'usr_op_10', first: 'Oscar', last: 'Ribera Aguilera', email: 'oscar.ribera@holatractor.com', mobile: '75905168' },
  { id: 'op_sc_11', user_id: 'usr_op_11', first: 'Ernesto', last: 'Suárez Banzer', email: 'ernesto.suarez@holatractor.com', mobile: '76016279' },
  { id: 'op_sc_12', user_id: 'usr_op_12', first: 'Marcelo', last: 'Quiroga Santa Cruz', email: 'marcelo.quiroga@holatractor.com', mobile: '77127380' },
  { id: 'op_sc_13', user_id: 'usr_op_13', first: 'Alvaro', last: 'Garcia Linera', email: 'alvaro.garcia@holatractor.com', mobile: '78238491' },
  { id: 'op_sc_14', user_id: 'usr_op_14', first: 'Ruben', last: 'Costas Aguilera', email: 'ruben.costas@holatractor.com', mobile: '79349502' },
  { id: 'op_sc_15', user_id: 'usr_op_15', first: 'Percy', last: 'Fernandez Añez', email: 'percy.fernandez@holatractor.com', mobile: '71450613' },
  { id: 'op_sc_16', user_id: 'usr_op_16', first: 'Johnny', last: 'Fernandez Saucedo', email: 'johnny.fernandez@holatractor.com', mobile: '72561724' },
  { id: 'op_sc_17', user_id: 'usr_op_17', first: 'Gary', last: 'Prado Salmon', email: 'gary.prado@holatractor.com', mobile: '73672835' },
  { id: 'op_sc_18', user_id: 'usr_op_18', first: 'Branko', last: 'Marinkovic Jovicevic', email: 'branko.marinkovic@holatractor.com', mobile: '74783946' },
  { id: 'op_sc_19', user_id: 'usr_op_19', first: 'Guido', last: 'Nayor Justiniano', email: 'guido.nayor@holatractor.com', mobile: '75894057' },
  { id: 'op_sc_20', user_id: 'usr_op_20', first: 'Ronald', last: 'Raldes Balcazar', email: 'ronald.raldes@holatractor.com', mobile: '76905168' },
  { id: 'op_sc_21', user_id: 'usr_op_21', first: 'Marco', last: 'Etcheverry Vargas', email: 'marco.etcheverry@holatractor.com', mobile: '77016279' },
  { id: 'op_sc_22', user_id: 'usr_op_22', first: 'Jaime', last: 'Moreno Morales', email: 'jaime.moreno@holatractor.com', mobile: '78127380' },
  { id: 'op_sc_23', user_id: 'usr_op_23', first: 'Milton', last: 'Melgar Soruco', email: 'milton.melgar@holatractor.com', mobile: '79238491' },
  { id: 'op_sc_24', user_id: 'usr_op_24', first: 'Erwin', last: 'Sanchez Freking', email: 'erwin.sanchez@holatractor.com', mobile: '70349502' },
  { id: 'op_sc_25', user_id: 'usr_op_25', first: 'Juan', last: 'Carlos Arce Justiniano', email: 'jc.arce@holatractor.com', mobile: '71450613' },
  { id: 'op_sc_26', user_id: 'usr_op_26', first: 'Marcelo', last: 'Martins Moreno', email: 'marcelo.martins@holatractor.com', mobile: '72561724' },
  { id: 'op_sc_27', user_id: 'usr_op_27', first: 'Joselito', last: 'Vaca Velasco', email: 'joselito.vaca@holatractor.com', mobile: '73672835' },
  { id: 'op_sc_28', user_id: 'usr_op_28', first: 'Gualberto', last: 'Mojica Olmos', email: 'gualberto.mojica@holatractor.com', mobile: '74783946' },
  { id: 'op_sc_29', user_id: 'usr_op_29', first: 'Alejandro', last: 'Chumacero Alvarez', email: 'alejandro.chumacero@holatractor.com', mobile: '75894057' },
  { id: 'op_sc_30', user_id: 'usr_op_30', first: 'Rudy', last: 'Cardozo Fernandez', email: 'rudy.cardozo@holatractor.com', mobile: '76905168' },
  { id: 'op_sc_31', user_id: 'usr_op_31', first: 'Mauricio', last: 'Saucedo Guardia', email: 'mauricio.saucedo@holatractor.com', mobile: '77016279' },
  { id: 'op_sc_32', user_id: 'usr_op_32', first: 'Wálter', last: 'Flores Condori', email: 'walter.flores@holatractor.com', mobile: '78127380' },
  { id: 'op_sc_33', user_id: 'usr_op_33', first: 'Edemir', last: 'Rodriguez Mercado', email: 'edemir.rodriguez@holatractor.com', mobile: '79238491' },
  { id: 'op_sc_34', user_id: 'usr_op_34', first: 'Ignacio', last: 'Garcia Justiniano', email: 'ignacio.garcia@holatractor.com', mobile: '70349502' },
  { id: 'op_sc_35', user_id: 'usr_op_35', first: 'Luis', last: 'Alberto Gutierrez Herrera', email: 'luis.gutierrez@holatractor.com', mobile: '71450613' },
  { id: 'op_sc_36', user_id: 'usr_op_36', first: 'Carlos', last: 'Emilio Lampe Porras', email: 'carlos.lampe@holatractor.com', mobile: '72561724' },
  { id: 'op_sc_37', user_id: 'usr_op_37', first: 'Guillermo', last: 'Viscarra Bruckner', email: 'guillermo.viscarra@holatractor.com', mobile: '73672835' },
  { id: 'op_sc_38', user_id: 'usr_op_38', first: 'Daniel', last: 'Vaca Tasca', email: 'daniel.vaca@holatractor.com', mobile: '74783946' },
  { id: 'op_sc_39', user_id: 'usr_op_39', first: 'Sergio', last: 'Galarza Soliz', email: 'sergio.galarza@holatractor.com', mobile: '75894057' },
  { id: 'op_sc_40', user_id: 'usr_op_40', first: 'Jose', last: 'Carlo Fernandez', email: 'jose.carlo@holatractor.com', mobile: '76905168' },
  { id: 'op_sc_41', user_id: 'usr_op_41', first: 'Marco', last: 'Barrero Rojas', email: 'marco.barrero@holatractor.com', mobile: '77016279' },
  { id: 'op_sc_42', user_id: 'usr_op_42', first: 'Miguel', last: 'Angel Rimba Alvis', email: 'miguel.rimba@holatractor.com', mobile: '78127380' },
  { id: 'op_sc_43', user_id: 'usr_op_43', first: 'Sandy', last: 'Marco Antonio', email: 'marco.sandy@holatractor.com', mobile: '79238491' },
  { id: 'op_sc_44', user_id: 'usr_op_44', first: 'Juan', last: 'Manuel Peña Montaño', email: 'juan.pena@holatractor.com', mobile: '70349502' },
  { id: 'op_sc_45', user_id: 'usr_op_45', first: 'Gustavo', last: 'Quinteros Desabato', email: 'gustavo.quinteros@holatractor.com', mobile: '71450613' },
  { id: 'op_sc_46', user_id: 'usr_op_46', first: 'Carlos', last: 'Borja Bolivar', email: 'carlos.borja@holatractor.com', mobile: '72561724' }
];

async function seed() {
  const client = await pool.connect();
  try {
    const baseRes = await client.query('SELECT id FROM "Base" LIMIT 1');
    const baseId = baseRes.rows[0]?.id || 'cm89t43ky00034wft9fiixpc7';

    console.log('Seeding into Render DB with base_id:', baseId);

    // 1. Dealers
    for (const d of DEALERS) {
      await client.query(`
        INSERT INTO "User" (
          id, first_name, middle_name, last_name, email, mobile, country_code,
          gender, "authType", "phoneVerified", "emailVerified", "request_to_delete",
          base_id, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, '', $3, $4, $5, '+591', 'male', 'EMAIL', true, true, false, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          mobile = EXCLUDED.mobile;
      `, [d.user_id, d.first, d.last, d.email, d.mobile, baseId]);

      await client.query(`
        INSERT INTO "Dealer" (id, base_id, user_id, role_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          "Status" = 1,
          "updatedAt" = NOW();
      `, [d.id, baseId, d.user_id, DEALER_ROLE_ID]);
    }
    console.log(`Successfully synced ${DEALERS.length} Dealers to Render DB!`);

    // 2. Operators with Document attachment
    for (const [idx, op] of OPERATORS.entries()) {
      await client.query(`
        INSERT INTO "User" (
          id, first_name, middle_name, last_name, email, mobile, country_code,
          gender, "authType", "phoneVerified", "emailVerified", "request_to_delete",
          base_id, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, '', $3, $4, $5, '+591', 'male', 'EMAIL', true, true, false, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          mobile = EXCLUDED.mobile;
      `, [op.user_id, op.first, op.last, op.email, op.mobile, baseId]);

      const docId = `doc_op_${idx + 1}`;
      await client.query(`
        INSERT INTO "Document" (id, base_id, document_number, attachment, "createdAt", "updatedAT")
        VALUES ($1, $2, $3, 'https://holadashboard.s3.amazonaws.com/operator-license.pdf', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [docId, baseId, `LIC-CAT-C-${1000 + idx}`]);

      await client.query(`
        INSERT INTO "Operator" (id, base_id, user_id, role_id, document_attachment_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          "Status" = 1,
          "updatedAt" = NOW();
      `, [op.id, baseId, op.user_id, OPERATOR_ROLE_ID, docId]);
    }
    console.log(`Successfully synced ${OPERATORS.length} Operators to Render DB!`);
  } finally {
    client.release();
    pool.end();
  }
}

seed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
