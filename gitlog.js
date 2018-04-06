/*
run this in CLI:

git log --pretty=format:'{%n “%H”: "%aN <%aE>", "%ad", "%f"%n},' $@ | perl -pe 'BEGIN{print "["}; END{print "]\n"}' | perl -pe 's/},]/}]/'



*/