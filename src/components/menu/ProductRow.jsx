"use client";
import { formatPrice, hasOffer, unitPrice } from "@/lib/site";
import ProductImage from "./ProductImage";
import s from "./menu.module.css";

export function Price({ product, big = false }) {
  const offer = hasOffer(product);
  return (
    <span className={`${s.price} ${big ? s.priceBig : ""}`}>
      {offer ? (
        <del className={s.priceOld}>
          <span className="visually-hidden">Antes </span>
          {formatPrice(product.valor)}
        </del>
      ) : null}
      <span className={offer ? s.priceOffer : undefined}>{formatPrice(unitPrice(product))}</span>
    </span>
  );
}

/** Tarjeta entera clickeable: el botón del título se estira sobre la tarjeta (::after). */
export default function ProductRow({ product, onOpen }) {
  return (
    <li className={s.row}>
      <div className={s.rowText}>
        <h3 className={s.rowName}>
          <button type="button" className={s.rowBtn} onClick={() => onOpen(product)} aria-haspopup="dialog">
            {product.nombre}
          </button>
        </h3>
        {product.descripcion ? <p className={s.rowDesc}>{product.descripcion}</p> : null}
        <div className={s.rowMeta}>
          <Price product={product} />
          {hasOffer(product) ? <span className={s.badge}>Oferta</span> : null}
        </div>
      </div>
      <ProductImage src={product.imagen} alt="" width={240} className={s.rowImg} />
    </li>
  );
}
