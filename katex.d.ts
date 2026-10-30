// `katex` paketida tip e’loni yo‘q (faqat sinov sahifasi uchun ishlatiladi): komponent faqat renderToString ni chaqiradi.
declare module "katex" {
  const katex: { renderToString: (tex: string, options?: object) => string };
  export default katex;
}
