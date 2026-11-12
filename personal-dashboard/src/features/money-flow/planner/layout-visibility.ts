// A reserved layout key stores visibility using the existing positions schema.
// The marker never becomes a canvas node. The element's position can be restored.
export const hiddenElementLayoutKey = (id: string) => `hidden-element:${id}`;
