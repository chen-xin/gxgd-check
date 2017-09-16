pdf = '../gxgd_desktop/.data/REPOSITORY/sample_repo/人月神话.pdf'
import re
pattern = re.compile(rb'(^\s*<<|^\s*>>|^\s*\/|obj)')
with open(pdf, 'rb') as f:
  # data = f.read()
  # lines = data.split('\n'.encode())
  for l in f:
    if pattern.match(l):
      print(l)