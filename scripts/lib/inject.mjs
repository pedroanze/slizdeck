/**
 * slizdeck · inject
 *
 * Inserta un fragmento (el harness de un script) justo antes del ULTIMO
 * </body> del deck. html.replace('</body>', …) usa el primero, y un deck
 * puede contener el texto "</body>" antes del real (dentro de un string de
 * JS, de un ejemplo de codigo en una slide): el harness caia adentro de ese
 * string, rompia el script del deck y Chrome headless se quedaba esperando
 * un resultado que nunca llegaba.
 */
export function injectBeforeBodyEnd(html, fragment) {
  const i = html.lastIndexOf('</body>');
  if (i === -1) return html + fragment;
  return html.slice(0, i) + fragment + html.slice(i);
}
