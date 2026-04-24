import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllDivisions,
  getAllDistricts,
  getAllUpazilas,
  getAllUnions,
} from 'bd-address-pro';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '..', 'public', 'data', 'location-dataset.json');

const divisions = getAllDivisions();
const districts = getAllDistricts();
const upazilas = getAllUpazilas();
const unions = getAllUnions();

const districtsByDivision = {};
districts.forEach((d) => {
  if (!districtsByDivision[d.divisionId]) districtsByDivision[d.divisionId] = [];
  districtsByDivision[d.divisionId].push(d);
});

const upazilasByDistrict = {};
upazilas.forEach((u) => {
  if (!upazilasByDistrict[u.districtId]) upazilasByDistrict[u.districtId] = [];
  upazilasByDistrict[u.districtId].push(u);
});

const unionsByUpazila = {};
unions.forEach((u) => {
  if (!unionsByUpazila[u.upazilaId]) unionsByUpazila[u.upazilaId] = [];
  unionsByUpazila[u.upazilaId].push(u);
});

const hierarchical = divisions.map((div) => ({
  id: div.id,
  name: div.name,
  bnName: div.bnName,
  districts: (districtsByDivision[div.id] || []).map((dist) => ({
    id: dist.id,
    name: dist.name,
    bnName: dist.bnName,
    divisionId: div.id,
    upazilas: (upazilasByDistrict[dist.id] || []).map((upa) => ({
      id: upa.id,
      name: upa.name,
      bnName: upa.bnName,
      districtId: dist.id,
      divisionId: div.id,
      unions: (unionsByUpazila[upa.id] || []).map((un) => ({
        id: un.id,
        name: un.name,
        bnName: un.bnName,
        upazilaId: upa.id,
        districtId: dist.id,
        divisionId: div.id,
        areaType: 'union'
      }))
    }))
  }))
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ hierarchical }, null, 2));

console.log('✅ Bangladesh location dataset generated');
