# ver todas as chaves
npx wrangler d1 execute gestortrip-licenses --command="SELECT * FROM licenses" --remote

# ver chaves usadas
npx wrangler d1 execute gestortrip-licenses --command="SELECT license_key, used_at, device_id FROM licenses WHERE used=1"

# deletar todas as chaves
npx wrangler d1 execute gestortrip-licenses --command="DELETE FROM licenses" --remote

# deletar uma chave específica
npx wrangler d1 execute gestortrip-licenses --command="DELETE FROM licenses WHERE license_key='GT-XXXXX-XXXXX-XXXXX'" --remote

# resetar uma chave usada (para reativação)
npx wrangler d1 execute gestortrip-licenses --command="UPDATE licenses SET used=0, device_id=NULL, used_at=NULL WHERE license_key='GT-XXXXX-XXXXX-XXXXX'" --remote

# comando para gerar as keys: 
node generate-licenses.js (quantidade)

# criar o banco D1
npx wrangler d1 create gestortrip-licenses

# criar tabela
wrangler d1 execute gestortrip-licenses ---file=schema.sql
SHA256 do fingerprint
ISO timestamp
0 = não usada, 1 = usada

# deploy do worker
cd license-api
npm run deploy

