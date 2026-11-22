// Genera los archivos para Firebase a partir del respaldo y la carta del flyer:
// - actualizar-hamburguesas.json: borra las hamburguesas del respaldo y agrega las nuevas.
// - restaurar-otros.json: papas, bebidas y otros tal como estaban en el respaldo.
// Uso: node scripts/carta/generar-update.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { cleanIngredients, ingredientsText } from "../../src/lib/site.js";

const dir = new URL("./", import.meta.url);
const backup = JSON.parse(readFileSync(new URL("respaldo-comidas.json", dir), "utf8"));

const BRIOCHE = ["Pan brioche"];
const CARNE = ["Carne 100% tapa de asado"];
const CARTA = [
  ["cheeseburger", "Cheeseburger", [8500, 12500, 15000, 16800], BRIOCHE, ["Salsa Staker", "Cheddar"]],
  ["bacon-extreme", "Bacon Extreme", [11500, 14000, 17000, 19000], BRIOCHE, ["Salsa Staker", "BBQ", "Cheddar", "Panceta crocante"]],
  ["american", "American", [10500, 13500, 15000, 17000], BRIOCHE, ["Salsa Staker", "Cheddar", "Lechuga repollada", "Tomate"]],
  ["onion-oklahoma", "Onion Oklahoma", [10500, 13500, 15000, 17000], BRIOCHE, ["Mostaza", "Cheddar", "Cebolla", "Pepinillos"]],
  ["crispy", "Crispy con queso cheddar", [12000, 15000, 18000, 20000], BRIOCHE, ["Salsa Staker", "BBQ", "Bacon", "Cebolla crispy", "Cheddar"]],
  ["la-argenta", "La Argenta", [9500, 13000, 16000, 17500], BRIOCHE, ["Mayonesa de chimichurri", "Cebolla morada", "Lechuga", "El mix de 1000 granos"]],
  ["la-toro", "La Toro", [12000, 14000, 17000, 19000], ["Pan brioche especial"], ["Salsa especial", "Cheddar", "Panceta", "Huevo", "Pepinillos"]],
];

const update = {};
const otros = {};
for (const [id, p] of Object.entries(backup)) {
  if (p.categoria === "hamburguesas") update[id] = null;
  else otros[id] = p;
}
for (const [id, nombre, [valor, doble, triple, cuadruple], pan, aderezos] of CARTA) {
  const ingredientes = cleanIngredients({ pan, carne: CARNE, aderezos });
  update[id] = {
    nombre,
    descripcion: ingredientsText(ingredientes),
    categoria: "hamburguesas",
    valor,
    oferta: false,
    valorOferta: 0,
    imagen: "",
    medallones: 1,
    precios: { doble, triple, cuadruple },
    ingredientes,
    oculto: false,
  };
}

writeFileSync(new URL("actualizar-hamburguesas.json", dir), `${JSON.stringify(update, null, 2)}\n`);
writeFileSync(new URL("restaurar-otros.json", dir), `${JSON.stringify(otros, null, 2)}\n`);
console.log(`Hamburguesas: borra ${Object.values(update).filter((v) => v === null).length}, agrega ${CARTA.length}. Otros para restaurar: ${Object.keys(otros).length}.`);
