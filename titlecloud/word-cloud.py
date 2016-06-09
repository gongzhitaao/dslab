import os

import pybtex.database as pybib_db
import wordcloud as wc

from PIL import Image
import numpy as np

import matplotlib
matplotlib.use('Qt5Agg')
import matplotlib.pyplot as plt


bib_data = pybib_db.parse_file('weishinn-ku.bib')
bib_data = bib_data.lower()

titles = []
for entry in bib_data.entries.values():
    titles.append(entry.fields['title'])

print("Total {0} titles.".format(len(titles)))

text = ' '.join(titles)

text = text.upper()

# "network" appears 22 times
text = text.replace("NETWORK", " ", 16)
text = text.replace("QUERY", "QUERIES")

stopwords = set([
    x.strip() for x in open('stopwords', 'r').read().split('\n')])

icon = Image.open('data.png')
mask = Image.new("RGB", icon.size, (255,255,255))
mask.paste(icon, icon)
mask = np.array(mask)

cloud_generator = wc.WordCloud(mask=mask,
                               background_color='white',
                               # max_font_size=300,
                               font_path='mplus-1m-regular-webfont.ttf',
                               stopwords=stopwords)
title_cloud = cloud_generator.generate(text)
title_cloud.to_file('title0.png')

plt.imshow(title_cloud)
plt.axis('off')
plt.show()
plt.savefig("title1.png",bbox_inches='tight')
