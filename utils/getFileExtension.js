function getFileExtension(uri) {
  return uri
    .split('.')
    .pop()
    .split(/#|\?/)[0];
}
export default getFileExtension;
