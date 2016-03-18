import pybtex.database as pybib_db
import wordcloud as wc
import matplotlib.pyplot as plt

bib_data = pybib_db.parse_file('weishinn-ku.bib')
bib_data = bib_data.lower()

titles = []
for entry in bib_data.entries.values():
    titles.append(entry.fields['title'])

print("Total {0} titles.".format(len(titles)))

text = ' '.join(titles)

# "network" appears 22 times
text = text.replace("network", " ", 16)

stopwords = set([x.strip()
                 for x in open('stopwords', 'r').read().split('\n')])
cloud_generator = wc.WordCloud(
    width=1000, height=600, margin=5, background_color='white',
    stopwords=stopwords)
title_cloud = cloud_generator.generate(text)
plt.imshow(title_cloud)
plt.tight_layout(True)
plt.axis('off')
plt.show()
