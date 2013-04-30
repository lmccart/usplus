#!/bin/bash
mongorestore --db fixus -c LIWC LIWC.bson
mongorestore --db fixus -c LIWC_wildcards LIWC_wildcards.bson
echo "loaded LIWC libs into mongodb"