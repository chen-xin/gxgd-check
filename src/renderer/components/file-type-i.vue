<template>
  <i :class="['fa', iconDef.type]" :style="{ color: iconDef.color}"></i>
</template>

<script>
function normalizeFileType (fileType, className = type => `fa-file-${type}-o`, defaults = 'fa-file-o') {
  fileType = fileType.replace(/^\./, '')
  let fileTypes = {
    pdf: {type: className('pdf'), color: 'Crimson'},
    jpg: {type: className('image'), color: 'LimeGreen'},
    jpeg: {type: className('image'), color: 'LimeGreen'},
    gif: {type: className('image'), color: 'LimeGreen'},
    bmp: {type: className('image'), color: 'LimeGreen'},
    png: {type: className('image'), color: 'LimeGreen'},
    tif: {type: className('image'), color: 'LimeGreen'},
    tiff: {type: className('image'), color: 'LimeGreen'},
    doc: {type: className('word'), color: 'SteelBlue'},
    docx: {type: className('word'), color: 'SteelBlue'},
    xls: {type: className('excel'), color: 'Green'},
    xlsx: {type: className('excel'), color: 'Green'},
    ppt: {type: className('powerpoint'), color: 'LightSalmon'},
    pptx: {type: className('powerpoint'), color: 'LightSalmon'},
    zip: {type: className('archive'), color: 'Gold'},
    unknown: {type: defaults, color: 'grey'}
  }
  return fileTypes[fileType] ? fileTypes[fileType] : fileTypes['unknown']
}

export default {
  props: {
    fileType: String
  },
  computed: {
    iconDef () {
      return normalizeFileType(this.fileType)
    }
  }
}
</script>
