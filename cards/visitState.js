const fs = require("fs");

let arg = {
    "ast": "TranslationUnit",
    "filename": "/Users/mp/alicenode_inhabitat/state.h",
    "nodes": [
       {
          "ast": "VarDecl",
          "loc": {
             "begin": {
                "char": 440,
                "col": 1,
                "line": 22
             },
             "end": {
                "char": 473,
                "col": 34,
                "line": 22
             }
          },
          "name": "field_dim",
          "type": "const int"
       },
       {
          "ast": "VarDecl",
          "loc": {
             "begin": {
                "char": 520,
                "col": 1,
                "line": 23
             },
             "end": {
                "char": 552,
                "col": 33,
                "line": 23
             }
          },
          "name": "land_dim",
          "type": "const int"
       },
       {
          "ast": "StructDecl",
          "loc": {
             "begin": {
                "char": 597,
                "col": 1,
                "line": 25
             },
             "end": {
                "char": 744,
                "col": 2,
                "line": 33
             }
          },
          "name": "Object",
          "nodes": [
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 614,
                      "col": 2,
                      "line": 26
                   },
                   "end": {
                      "char": 632,
                      "col": 20,
                      "line": 26
                   }
                },
                "name": "location",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 635,
                      "col": 2,
                      "line": 27
                   },
                   "end": {
                      "char": 646,
                      "col": 13,
                      "line": 27
                   }
                },
                "name": "scale",
                "offsetof": 0,
                "sizeof": 4,
                "type": "float"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 649,
                      "col": 2,
                      "line": 28
                   },
                   "end": {
                      "char": 670,
                      "col": 23,
                      "line": 28
                   }
                },
                "name": "orientation",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 673,
                      "col": 2,
                      "line": 29
                   },
                   "end": {
                      "char": 684,
                      "col": 13,
                      "line": 29
                   }
                },
                "name": "phase",
                "offsetof": 0,
                "sizeof": 4,
                "type": "float"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 687,
                      "col": 2,
                      "line": 30
                   },
                   "end": {
                      "char": 705,
                      "col": 20,
                      "line": 30
                   }
                },
                "name": "velocity",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 708,
                      "col": 2,
                      "line": 31
                   },
                   "end": {
                      "char": 723,
                      "col": 17,
                      "line": 31
                   }
                },
                "name": "accel",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 726,
                      "col": 2,
                      "line": 32
                   },
                   "end": {
                      "char": 741,
                      "col": 17,
                      "line": 32
                   }
                },
                "name": "color",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             }
          ],
          "type": "Object"
       },
       {
          "ast": "StructDecl",
          "loc": {
             "begin": {
                "char": 747,
                "col": 1,
                "line": 35
             },
             "end": {
                "char": 877,
                "col": 2,
                "line": 42
             }
          },
          "name": "Segment",
          "nodes": [
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 765,
                      "col": 2,
                      "line": 36
                   },
                   "end": {
                      "char": 783,
                      "col": 20,
                      "line": 36
                   }
                },
                "name": "location",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 786,
                      "col": 2,
                      "line": 37
                   },
                   "end": {
                      "char": 797,
                      "col": 13,
                      "line": 37
                   }
                },
                "name": "scale",
                "offsetof": 0,
                "sizeof": 4,
                "type": "float"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 800,
                      "col": 2,
                      "line": 38
                   },
                   "end": {
                      "char": 821,
                      "col": 23,
                      "line": 38
                   }
                },
                "name": "orientation",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 824,
                      "col": 2,
                      "line": 39
                   },
                   "end": {
                      "char": 835,
                      "col": 13,
                      "line": 39
                   }
                },
                "name": "phase",
                "offsetof": 0,
                "sizeof": 4,
                "type": "float"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 838,
                      "col": 2,
                      "line": 40
                   },
                   "end": {
                      "char": 856,
                      "col": 20,
                      "line": 40
                   }
                },
                "name": "velocity",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 859,
                      "col": 2,
                      "line": 41
                   },
                   "end": {
                      "char": 874,
                      "col": 17,
                      "line": 41
                   }
                },
                "name": "color",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             }
          ],
          "type": "Segment"
       },
       {
          "ast": "StructDecl",
          "loc": {
             "begin": {
                "char": 880,
                "col": 1,
                "line": 44
             },
             "end": {
                "char": 959,
                "col": 2,
                "line": 48
             }
          },
          "name": "Particle",
          "nodes": [
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 899,
                      "col": 2,
                      "line": 45
                   },
                   "end": {
                      "char": 917,
                      "col": 20,
                      "line": 45
                   }
                },
                "name": "location",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 920,
                      "col": 2,
                      "line": 46
                   },
                   "end": {
                      "char": 935,
                      "col": 17,
                      "line": 46
                   }
                },
                "name": "color",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 938,
                      "col": 2,
                      "line": 47
                   },
                   "end": {
                      "char": 956,
                      "col": 20,
                      "line": 47
                   }
                },
                "name": "velocity",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             }
          ],
          "type": "Particle"
       },
       {
          "ast": "StructDecl",
          "loc": {
             "begin": {
                "char": 962,
                "col": 1,
                "line": 50
             },
             "end": {
                "char": 1020,
                "col": 2,
                "line": 53
             }
          },
          "name": "DebugDot",
          "nodes": [
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 981,
                      "col": 2,
                      "line": 51
                   },
                   "end": {
                      "char": 999,
                      "col": 20,
                      "line": 51
                   }
                },
                "name": "location",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 1002,
                      "col": 2,
                      "line": 52
                   },
                   "end": {
                      "char": 1017,
                      "col": 17,
                      "line": 52
                   }
                },
                "name": "color",
                "offsetof": 0,
                "sizeof": 4,
                "type": "int"
             }
          ],
          "type": "DebugDot"
       },
       {
          "ast": "StructDecl",
          "loc": {
             "begin": {
                "char": 1023,
                "col": 1,
                "line": 55
             },
             "end": {
                "char": 1989,
                "col": 2,
                "line": 83
             }
          },
          "name": "State",
          "nodes": [
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 1039,
                      "col": 2,
                      "line": 56
                   },
                   "end": {
                      "char": 1072,
                      "col": 35,
                      "line": 56
                   }
                },
                "name": "particles",
                "nodes": [
                   {
                      "ast": "TypeRef",
                      "loc": {
                         "begin": {
                            "char": 1039,
                            "col": 2,
                            "line": 56
                         },
                         "end": {
                            "char": 1047,
                            "col": 10,
                            "line": 56
                         }
                      },
                      "name": "struct Particle",
                      "type": "Particle"
                   },
                   {
                      "ast": "BinaryOperator",
                      "loc": {
                         "begin": {
                            "char": 1058,
                            "col": 21,
                            "line": 56
                         },
                         "end": {
                            "char": 1071,
                            "col": 34,
                            "line": 56
                         }
                      },
                      "nodes": [
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1058,
                                  "col": 21,
                                  "line": 56
                               },
                               "end": {
                                  "char": 1071,
                                  "col": 34,
                                  "line": 56
                               }
                            },
                            "type": "int"
                         },
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1058,
                                  "col": 21,
                                  "line": 56
                               },
                               "end": {
                                  "char": 1071,
                                  "col": 34,
                                  "line": 56
                               }
                            },
                            "type": "int"
                         }
                      ],
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 262144,
                "type": "Particle [262144]"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 1075,
                      "col": 2,
                      "line": 57
                   },
                   "end": {
                      "char": 1102,
                      "col": 29,
                      "line": 57
                   }
                },
                "name": "objects",
                "nodes": [
                   {
                      "ast": "TypeRef",
                      "loc": {
                         "begin": {
                            "char": 1075,
                            "col": 2,
                            "line": 57
                         },
                         "end": {
                            "char": 1081,
                            "col": 8,
                            "line": 57
                         }
                      },
                      "name": "struct Object",
                      "type": "Object"
                   },
                   {
                      "ast": "IntegerLiteral",
                      "loc": {
                         "begin": {
                            "char": 1090,
                            "col": 17,
                            "line": 57
                         },
                         "end": {
                            "char": 1101,
                            "col": 28,
                            "line": 57
                         }
                      },
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 32,
                "type": "Object [32]"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 1105,
                      "col": 2,
                      "line": 58
                   },
                   "end": {
                      "char": 1135,
                      "col": 32,
                      "line": 58
                   }
                },
                "name": "segments",
                "nodes": [
                   {
                      "ast": "TypeRef",
                      "loc": {
                         "begin": {
                            "char": 1105,
                            "col": 2,
                            "line": 58
                         },
                         "end": {
                            "char": 1112,
                            "col": 9,
                            "line": 58
                         }
                      },
                      "name": "struct Segment",
                      "type": "Segment"
                   },
                   {
                      "ast": "IntegerLiteral",
                      "loc": {
                         "begin": {
                            "char": 1122,
                            "col": 19,
                            "line": 58
                         },
                         "end": {
                            "char": 1134,
                            "col": 31,
                            "line": 58
                         }
                      },
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 64,
                "type": "Segment [64]"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 1139,
                      "col": 2,
                      "line": 60
                   },
                   "end": {
                      "char": 1172,
                      "col": 35,
                      "line": 60
                   }
                },
                "name": "debugdots",
                "nodes": [
                   {
                      "ast": "TypeRef",
                      "loc": {
                         "begin": {
                            "char": 1139,
                            "col": 2,
                            "line": 60
                         },
                         "end": {
                            "char": 1147,
                            "col": 10,
                            "line": 60
                         }
                      },
                      "name": "struct DebugDot",
                      "type": "DebugDot"
                   },
                   {
                      "ast": "BinaryOperator",
                      "loc": {
                         "begin": {
                            "char": 1158,
                            "col": 21,
                            "line": 60
                         },
                         "end": {
                            "char": 1171,
                            "col": 34,
                            "line": 60
                         }
                      },
                      "nodes": [
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1158,
                                  "col": 21,
                                  "line": 60
                               },
                               "end": {
                                  "char": 1171,
                                  "col": 34,
                                  "line": 60
                               }
                            },
                            "type": "int"
                         },
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1158,
                                  "col": 21,
                                  "line": 60
                               },
                               "end": {
                                  "char": 1171,
                                  "col": 34,
                                  "line": 60
                               }
                            },
                            "type": "int"
                         }
                      ],
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 16384,
                "type": "DebugDot [16384]"
             },
             {
                "ast": "FieldDecl",
                "comment": {
                   "text": "// signed distance field representing the landscape\n\t// the distance to the nearest land surface, as a 3D SDF\n\t// scaled such that the distance across the entire space == 1\n\t// distances are normalized over the LAND_DIM as 0..1"
                },
                "loc": {
                   "begin": {
                      "char": 1688,
                      "col": 2,
                      "line": 75
                   },
                   "end": {
                      "char": 1715,
                      "col": 29,
                      "line": 75
                   }
                },
                "name": "distance",
                "nodes": [
                   {
                      "ast": "BinaryOperator",
                      "loc": {
                         "begin": {
                            "char": 1703,
                            "col": 17,
                            "line": 75
                         },
                         "end": {
                            "char": 1714,
                            "col": 28,
                            "line": 75
                         }
                      },
                      "nodes": [
                         {
                            "ast": "BinaryOperator",
                            "loc": {
                               "begin": {
                                  "char": 1703,
                                  "col": 17,
                                  "line": 75
                               },
                               "end": {
                                  "char": 1714,
                                  "col": 28,
                                  "line": 75
                               }
                            },
                            "nodes": [
                               {
                                  "ast": "IntegerLiteral",
                                  "loc": {
                                     "begin": {
                                        "char": 1703,
                                        "col": 17,
                                        "line": 75
                                     },
                                     "end": {
                                        "char": 1714,
                                        "col": 28,
                                        "line": 75
                                     }
                                  },
                                  "type": "int"
                               },
                               {
                                  "ast": "IntegerLiteral",
                                  "loc": {
                                     "begin": {
                                        "char": 1703,
                                        "col": 17,
                                        "line": 75
                                     },
                                     "end": {
                                        "char": 1714,
                                        "col": 28,
                                        "line": 75
                                     }
                                  },
                                  "type": "int"
                               }
                            ],
                            "type": "int"
                         },
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1703,
                                  "col": 17,
                                  "line": 75
                               },
                               "end": {
                                  "char": 1714,
                                  "col": 28,
                                  "line": 75
                               }
                            },
                            "type": "int"
                         }
                      ],
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 32000000,
                "type": "float [8000000]"
             },
             {
                "ast": "FieldDecl",
                "comment": {
                   "text": "// the boolean field that is used to generate the distance field\n\t// surface edges are marked by unequal neighbour values"
                },
                "loc": {
                   "begin": {
                      "char": 1841,
                      "col": 2,
                      "line": 78
                   },
                   "end": {
                      "char": 1875,
                      "col": 36,
                      "line": 78
                   }
                },
                "name": "distance_binary",
                "nodes": [
                   {
                      "ast": "BinaryOperator",
                      "loc": {
                         "begin": {
                            "char": 1863,
                            "col": 24,
                            "line": 78
                         },
                         "end": {
                            "char": 1874,
                            "col": 35,
                            "line": 78
                         }
                      },
                      "nodes": [
                         {
                            "ast": "BinaryOperator",
                            "loc": {
                               "begin": {
                                  "char": 1863,
                                  "col": 24,
                                  "line": 78
                               },
                               "end": {
                                  "char": 1874,
                                  "col": 35,
                                  "line": 78
                               }
                            },
                            "nodes": [
                               {
                                  "ast": "IntegerLiteral",
                                  "loc": {
                                     "begin": {
                                        "char": 1863,
                                        "col": 24,
                                        "line": 78
                                     },
                                     "end": {
                                        "char": 1874,
                                        "col": 35,
                                        "line": 78
                                     }
                                  },
                                  "type": "int"
                               },
                               {
                                  "ast": "IntegerLiteral",
                                  "loc": {
                                     "begin": {
                                        "char": 1863,
                                        "col": 24,
                                        "line": 78
                                     },
                                     "end": {
                                        "char": 1874,
                                        "col": 35,
                                        "line": 78
                                     }
                                  },
                                  "type": "int"
                               }
                            ],
                            "type": "int"
                         },
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1863,
                                  "col": 24,
                                  "line": 78
                               },
                               "end": {
                                  "char": 1874,
                                  "col": 35,
                                  "line": 78
                               }
                            },
                            "type": "int"
                         }
                      ],
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 32000000,
                "type": "float [8000000]"
             },
             {
                "ast": "FieldDecl",
                "comment": {
                   "text": "// the state of the lichen CA over the world"
                },
                "loc": {
                   "begin": {
                      "char": 1925,
                      "col": 2,
                      "line": 81
                   },
                   "end": {
                      "char": 1952,
                      "col": 29,
                      "line": 81
                   }
                },
                "name": "fungus",
                "nodes": [
                   {
                      "ast": "BinaryOperator",
                      "loc": {
                         "begin": {
                            "char": 1938,
                            "col": 15,
                            "line": 81
                         },
                         "end": {
                            "char": 1951,
                            "col": 28,
                            "line": 81
                         }
                      },
                      "nodes": [
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1938,
                                  "col": 15,
                                  "line": 81
                               },
                               "end": {
                                  "char": 1951,
                                  "col": 28,
                                  "line": 81
                               }
                            },
                            "type": "int"
                         },
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1938,
                                  "col": 15,
                                  "line": 81
                               },
                               "end": {
                                  "char": 1951,
                                  "col": 28,
                                  "line": 81
                               }
                            },
                            "type": "int"
                         }
                      ],
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 1048576,
                "type": "float [262144]"
             },
             {
                "ast": "FieldDecl",
                "loc": {
                   "begin": {
                      "char": 1955,
                      "col": 2,
                      "line": 82
                   },
                   "end": {
                      "char": 1986,
                      "col": 33,
                      "line": 82
                   }
                },
                "name": "fungus_old",
                "nodes": [
                   {
                      "ast": "BinaryOperator",
                      "loc": {
                         "begin": {
                            "char": 1972,
                            "col": 19,
                            "line": 82
                         },
                         "end": {
                            "char": 1985,
                            "col": 32,
                            "line": 82
                         }
                      },
                      "nodes": [
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1972,
                                  "col": 19,
                                  "line": 82
                               },
                               "end": {
                                  "char": 1985,
                                  "col": 32,
                                  "line": 82
                               }
                            },
                            "type": "int"
                         },
                         {
                            "ast": "IntegerLiteral",
                            "loc": {
                               "begin": {
                                  "char": 1972,
                                  "col": 19,
                                  "line": 82
                               },
                               "end": {
                                  "char": 1985,
                                  "col": 32,
                                  "line": 82
                               }
                            },
                            "type": "int"
                         }
                      ],
                      "type": "int"
                   }
                ],
                "offsetof": 0,
                "sizeof": 1048576,
                "type": "float [262144]"
             }
          ],
          "type": "State"
       }
    ]
 }

 //console.log(arg.nodes.name)

Object.keys(arg.nodes).forEach(function(key) {
    if (arg.nodes[key].name == "State") {
       // console.log(arg.nodes[key].nodes)

        Object.keys(arg.nodes[key].nodes).map(function(objectKey, index) {
            var value = arg.nodes[key].nodes[objectKey];
            console.log(value.name, value.offsetof, value.sizeof);
        });
    }
//console.log(arg.nodes[key].name)
})
/*
visit(arg)
console.log(arg)
function visit(node, parentnode, ctx) {
    //console.log("enter", node.ast, "of", parentnode ? parentnode.ast : node.filename);
    
    if (node.ast == "TranslationUnit"){
        ctx.name = node.filename;

        //put this ast's filename into the filename column of the IDE table
        $('#deckOneName').text(node.filename)

    
        //ctx.children.push(node.ast);

        let ctx1 = {
            name: name,
            children: [],
        }  


                // add more props depending on the node type

        //first check if a node has children, if not, ignore. 
        if (node.nodes){
            
            // do this for structs, tranlation units, 
            // but not for functions
            for (c of node.nodes) {
                visit(c, node, ctx1);
            }
        // console.log("exit", node.ast);

            ctx.children.push(ctx1);

            //ctx.children.push("</div>")
        }
    } else if (node.name) {

    ctx.children.push(node.name);
    ctx.name = node.name;

    let ctx1 = {
        name: name,
        children: [],
    }
    
        // add more props depending on the node type

    //first check if a node has children, if not, ignore. 
    if (node.nodes){
        
        // do this for structs, tranlation units, 
        // but not for functions
        for (c of node.nodes) {
            visit(c, node, ctx1);
        }

        ctx.children.push(ctx1);

    }

}

else if (node.mangled_name){

    ctx.children.push(node.name);
    ctx.name = node.name;

    let ctx1 = {
        name: name,
        children: [],
    }
    
        // add more props depending on the node type

    //first check if a node has children, if not, ignore. 
    if (node.nodes){
        
        // do this for structs, tranlation units, 
        // but not for functions
        for (c of node.nodes) {
            visit(c, node, ctx1);
        }
    // console.log("exit", node.ast);

        ctx.children.push(ctx1);

    }

}

}

let ctx = {
    name: name,

    children: [],
}
//recurse through the rest of the JSON
visit(deck, null, ctx);
//build the new tree
//newDeck = JSON.stringify(ctx, null, 3);
//the tree builder expects an array but the visitor function outputs an object, so:
//create a new array...
newTree = new Array();
//...and then add ctx to the array as its only object
newTree[0] = ctx;

root = newTree[0];



*/