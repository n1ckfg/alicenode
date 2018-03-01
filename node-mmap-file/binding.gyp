{
  "targets": [
    {
      "target_name": "mmapfile",
      "sources": [ "mmap-file.cpp" ],
      'include_dirs': [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}