// Genera el update de Firebase: borra las hamburguesas del respaldo y agrega las de la carta nueva.
// No toca papas, bebidas ni otros. Uso: node scripts/carta/generar-update.mjs
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL("./", import.meta.url);
const backup = JSON.parse(readFileSync(new URL("respaldo-comidas.json", dir), "utf8"));

const CARNE = "carne 100% tapa de asado";
const CARTA = [
  ["cheeseburger", "Cheeseburger", [8500, 12500, 15000, 16800], ["Pan brioche", "salsa Staker", CARNE, "cheddar"]],
  ["bacon-extreme", "Bacon Extreme", [11500, 14000, 17000, 19000], ["Pan brioche", "salsa Staker", "BBQ", CARNE, "cheddar", "panceta crocante"]],
  ["american", "American", [10500, 13500, 15000, 17000], ["Pan brioche", "salsa Staker", CARNE, "cheddar", "lechuga repollada", "tomate"]],
  ["onion-oklahoma", "Onion Oklahoma", [10500, 13500, 15000, 17000], ["Pan brioche", "mostaza", CARNE, "cheddar", "cebolla", "pepinillos"]],
  ["crispy", "Crispy con queso cheddar", [12000, 15000, 18000, 20000], ["Pan brioche", "salsa Staker", "BBQ", "bacon", "cebolla crispy", "cheddar", CARNE]],
  ["la-argenta", "La Argenta", [9500, 13000, 16000, 17500], ["Pan brioche", "mayonesa de chimichurri", "cebolla morada", "lechuga", CARNE, "el mix de 1000 granos"]],
  ["la-toro", "La Toro", [12000, 14000, 17000, 19000], ["Pan brioche especial", "salsa especial", CARNE, "cheddar", "panceta", "huevo", "pepinillos"]],
];

const update = {};
for (const [id, p] of Object.entries(backup)) if (p.categoria === "hamburguesas") update[id] = null;
for (const [id, nombre, [valor, doble, triple, cuadruple], ingredientes] of CARTA) {
  update[id] = {
    nombre,
    descripcion: `${ingredientes.join(", ")}.`,
    categoria: "hamburguesas",
    valor,
    oferta: false,
    valorOferta: 0,
    imagen: "",
    medallones: 1,
    precios: { doble, triple, cuadruple },
    oculto: false,
  };
}

writeFileSync(new URL("actualizar-hamburguesas.json", dir), `${JSON.stringify(update, null, 2)}\n`);
const borra = Object.values(update).filter((v) => v === null).length;
console.log(`Borra ${borra} hamburguesas, agrega ${CARTA.length}. Conserva ${Object.keys(backup).length - borra} productos.`);
