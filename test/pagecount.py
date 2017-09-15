pdf = "my.pdf"

import re

rxcountpages = re.compile(r"/Type\s*/Page([^s]|$)", re.MULTILINE|re.DOTALL)

def countPages(filename):
    data = open(filename,"rb").read()
    return len(rxcountpages.findall(data))

if __name__=="__main__":
    print ("Number of pages in PDF File:", countPages(pdf)  )