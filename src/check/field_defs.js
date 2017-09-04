import path from 'path'

export const pakFields = ['PID', 'PGUID', 'PDOCUMENTINDEX', 'PNAME', 'PAUTHOR', 'PCREATER',
  'PPOSTTIME', 'PREMARKS', 'PDOCUMENTSPAPERSETIONS', 'PELECTRONICMEDIANUMBER',
  'PMIJ', 'PMIJENDTIME', 'PDOCUMENTNAME', 'PBOOTPATH', 'PCHECKEDTIME',
  'PCHECKEDUSER']

export const docFields = ['OID', 'OGUID', 'ODOCUMENTINDEX', 'OPACKAGE', 'OTOTALDATACLASSIFICATION',
  'OGEOPOSITION', 'OLONG', 'OLAT', 'OMETAKEY', 'OPAGESTART', 'OPAGEEND',
  'OOGDTYPE', 'OAGDTYPE', 'OPROFESSIONALTECHNOLOGYTYPE',
  'OGEOLOGICALPROJECTTYPE', 'ODOCUMENTTYPE', 'OFILETYPE', 'OSCALE',
  'OSHEET', 'OUNITGUID', 'ONAME', 'OAUTHOR', 'OPROVINCE', 'OREGIONS',
  'OCOUNTY', 'OKCC', 'OWORKDEGREE', 'OURL2', 'OBOOTPATH', 'OMIJ',
  'OMIJENDTIME', 'OPOSTTIME', 'OCREATER', 'OFUNITCODE', 'OFTYPEBIT',
  'OFSETIONBIT', 'OFADDINGPAGEBIT', 'OFSORTBIT', 'OFSYMBOLBIT',
  'OFSUFFIXES', 'OREMARKS', 'OCHECKEDTIME', 'OCHECKEDUSER', 'OURL']

function getIndex (fieldDefs) {
  return field => fieldDefs.indexOf(field)
}

function name2ArchiveType (value) {
  return value.indexOf('原始') >= 0
    ? '794df296-69be-4568-9741-e837c45334b3' : value.indexOf('成果') >= 0
      ? 'b857896a-032a-46ec-b6ba-cba50fd628f7' : ''
}

export function newDocFields () {
  let ind = getIndex(docFields)
  return {
    uuid_v4: ind('OGUID'),
    doc_pack: ind('OPACKAGE'),
    no: ind('ODOCUMENTINDEX'),
    size: items => 0,
    hash_sha256: items => '',
    modify_time: items => '',
    doc_keeper: ind('OUNITGUID'),
    archive_type: ind('OTOTALDATACLASSIFICATION'),
    // ([''] + [item for item in items[ind('OBOOTPATH')].split('/') if item != ''])[-1],
    specialty: items => ['', ...items[ind('OBOOTPATH')].replace(/\/\s*$/, '').split('/')].pop(),
    // ''.join([items[i].strip() for i in [ind('OOGDTYPE'), ind('OAGDTYPE')]]),
    class: items => [ind('OOGDTYPE'), ind('OAGDTYPE')].reduce((total, value) => total + (items[value] || ''), ''),
    // mount_point: items => repoInfo['mount_point'],
    project_type: ind('OGEOLOGICALPROJECTTYPE'),
    media: ind('ODOCUMENTTYPE'),
    document_type: ind('ODOCUMENTTYPE'),
    project_location: ind('OGEOPOSITION'),
    start_longitude: ind('OLONG'),
    start_latitude: ind('OLAT'),
    key_words: ind('OMETAKEY'),
    scale: ind('OSCALE'),
    map_sheet: ind('OSHEET'),
    title: ind('ONAME'),
    author: ind('OAUTHOR'),
    // ([''] + [items[i] for i in [ind('OPROVINCE'), ind('OREGIONS'), ind('OCOUNTY')] if items[i].strip() != ''])[-1],
    region: items => [ind('OCOUNTY'), ind('OREGIONS'), ind('OPROVINCE')].find(value => !!value),
    province: ind('OPROVINCE'),
    city: ind('OREGIONS'),
    county: ind('OCOUNTY'),
    mine: ind('OKCC'),
    granularity: ind('OWORKDEGREE'),
    secrecy_level: ind('OMIJ'),
    secrecy_until: ind('OMIJENDTIME'),
    start_page: ind('OPAGESTART'),
    end_page: ind('OPAGEEND'),
    root_dir: ind('OBOOTPATH'),
    //  '/'.join([*[item for item in items[ind('OBOOTPATH')].split('/') if item != ''][-3:], items[ind('OURL')]]),
    uri: items => [...items[ind('OBOOTPATH')].replace(/\/\s*$/, '').split('/').slice(-3), items[ind('OURL')]].join('/'),
    url: ind('OURL'),
    submit_time: ind('OPOSTTIME'),
    recorder: ind('OCREATER'),
    auditor: ind('OCHECKEDUSER'),
    audit_time: ind('OCHECKEDTIME'),
    remarks: ind('OREMARKS'),
    file_type: items => path.parse(items[ind('OURL')]).ext.replace('.', '').toLowerCase()
  }
}

export function newPakFields () {
  let ind = getIndex(pakFields)
  return {
    uuid_v4: ind('PGUID'),
    title: ind('PNAME'),
    no: ind('PDOCUMENTINDEX'),
    doc_keeper: ind('PAUTHOR'),
    archive_type: items => name2ArchiveType(['', '', ...items[ind('PBOOTPATH')].replace(/\/\s*$/, '').split('/')].slice(-2)[0]),
    specialty: items => ['', ...items[ind('PBOOTPATH')].replace(/\/\s*$/, '').split('/')].pop(),
    secrecy_level: ind('PMIJ'),
    secrecy_until: ind('PMIJENDTIME'),
    // mount_point: items => repoInfo['mount_point'],
    uri: items => [...items[ind('PBOOTPATH')].replace(/\/\s*$/, '').split('/').slice(-3), items[ind('PDOCUMENTNAME')]].join('/'),
    physical_document_count: ind('PDOCUMENTSPAPERSETIONS'),
    electric_document_count: ind('PELECTRONICMEDIANUMBER'),
    root_dir: ind('PBOOTPATH'),
    dir: ind('PDOCUMENTNAME'),
    submit_time: ind('PPOSTTIME'),
    recorder: ind('PCREATER'),
    auditor: ind('PCHECKEDUSER'),
    audit_time: ind('PCHECKEDTIME'),
    remarks: ind('PREMARKS')
  }
}

export const requiredFields = {
  pak: [
    {field: 'uuid_v4', label: 'GUID', required: 1, len: 200},
    {field: 'title', label: '标题', required: 1, len: 200},
    {field: 'no', label: '编号', required: 0, len: 100},
    {field: 'doc_keeper', label: '保管单位', required: 1, len: 200},
    {field: 'archive_type', label: '总资料类别', required: 1, len: 200},
    {field: 'specialty', label: '类目', required: 1, len: 100},
    {field: 'auditor', label: '检查人', required: 1, len: 100},
    {field: 'uri', label: '档案目录', required: 1, len: 500}
  ],
  doc: [
    {field: 'doc_pack', label: '档案盒', required: 1, len: 200},
    {field: 'uuid_v4', label: 'GUID', required: 1, len: 200},
    {field: 'title', label: '标题', required: 1, len: 200},
    {field: 'no', label: '编号', required: 0, len: 100},
    {field: 'doc_keeper', label: '保管单位', required: 1, len: 200},
    {field: 'archive_type', label: '总资料类别', required: 1, len: 200},
    {field: 'specialty', label: '类目', required: 1, len: 100},
    {field: 'class', label: '资料类别', required: 1, len: 200},
    {field: 'auditor', label: '检查人', required: 1, len: 100},
    {field: 'uri', label: '档案目录', required: 1, len: 500}
  ]
}

export function line2Data (line, fieldDefs) {
  line = line.replace(/\\\\/g, '\\').replace(/\\/g, '/')
  let data = line.split('|')
  return Object.keys(fieldDefs).reduce(
    (total, field) =>
      typeof fieldDefs[field] === 'number'
        ? {...total, [field]: data[fieldDefs[field]]}
        : {...total, [field]: fieldDefs[field](data)}, {})
}
