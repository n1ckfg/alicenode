Dependencies for repo_graph:
	GraphViz:	
		Mac: brew install graphviz
			Windows: http://graphviz.gitlab.io/_pages/Download/Download_windows.html   -- Note, Windows install might not correctly bind to evnironment variable. If not, the repo_graph.js script won't work, because the CLI 'dot' program is required.

	child-process-promise (npm)

	filewatcher (npm)

	git-big-picture (michael's fork)
		https://github.com/michaelpalumbo/git-big-picture.git
		install using the setup.py.
			edit the git-big-picture.py to make changes to digraph output, then re-install using the setup.py