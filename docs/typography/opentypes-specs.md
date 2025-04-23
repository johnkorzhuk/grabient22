# OpenType Font File Specification

## Table of Contents
1. [Filenames](#filenames)
2. [Data Types](#data-types)
3. [Table Version Numbers](#table-version-numbers)
4. [Organization of an OpenType Font](#organization-of-an-opentype-font)
5. [Font Collections](#font-collections)
6. [Font Tables](#font-tables)

## Filenames

OpenType font files may have the extension .OTF, .TTF, .OTC or .TTC. (The extension may be upper or lower case.) The extensions .OTC and .TTC should only be used for font collection files.

## Data Types

The following data types are used in the OpenType font file. All OpenType fonts use big-endian (network) byte order:

| Data Type      | Description                                                                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| uint8          | 8-bit unsigned integer.                                                                                                                         |
| int8           | 8-bit signed integer.                                                                                                                           |
| uint16         | 16-bit unsigned integer.                                                                                                                        |
| int16          | 16-bit signed integer.                                                                                                                          |
| uint24         | 24-bit unsigned integer.                                                                                                                        |
| uint32         | 32-bit unsigned integer.                                                                                                                        |
| int32          | 32-bit signed integer.                                                                                                                          |
| Fixed          | 32-bit signed fixed-point number (16.16)                                                                                                        |
| FWORD          | int16 that describes a quantity in font design units.                                                                                           |
| UFWORD         | uint16 that describes a quantity in font design units.                                                                                          |
| F2DOT14        | 16-bit signed fixed number with the low 14 bits of fraction (2.14).                                                                             |
| LONGDATETIME   | Date and time represented in number of seconds since 12:00 midnight, January 1, 1904, UTC. The value is represented as a signed 64-bit integer. |
| Tag            | Array of four uint8s (length = 32 bits) used to identify a table, design-variation axis, script, language system, feature, or baseline.         |
| Offset8        | 8-bit offset to a table, same as uint8, NULL offset = 0x00                                                                                      |
| Offset16       | Short offset to a table, same as uint16, NULL offset = 0x0000                                                                                   |
| Offset24       | 24-bit offset to a table, same as uint24, NULL offset = 0x000000                                                                                |
| Offset32       | Long offset to a table, same as uint32, NULL offset = 0x00000000                                                                                |
| Version16Dot16 | Packed 32-bit value with major and minor version numbers.                                                                                       |

The F2DOT14 format consists of a signed, 2's complement integer and an unsigned fraction. To compute the actual value, take the integer and add the fraction. Examples of 2.14 values are:

| Decimal Value | Hex Value | Integer | Fraction    |
|---------------|-----------|---------|-------------|
| 1.999939      | 0x7fff    | 1       | 16383/16384 |
| 1.75          | 0x7000    | 1       | 12288/16384 |
| 0.000061      | 0x0001    | 0       | 1/16384     |
| 0.0           | 0x0000    | 0       | 0/16384     |
| -0.000061     | 0xffff    | -1      | 16383/16384 |
| -2.0          | 0x8000    | -2      | 0/16384     |

A Tag value is a uint8 array. Each byte within the array must have a value in the range 0x20 to 0x7E. This corresponds to the range of values of Unicode Basic Latin characters in UTF-8 encoding, which is the same as the printable ASCII characters.

## Table Version Numbers

Most tables have version numbers, and the version number for the entire font is contained in the table directory. There are five different table version number types:

1. A single uint16 field (versions starting at zero)
2. Separate uint16 major and minor version fields (versions starting at 1.0)
3. A uint32 field with enumerated values
4. A uint32 field with a numeric value (used only in DSIG and meta tables)
5. A Version16Dot16 field for major/minor version numbers (used only in maxp, post and vhea tables)

Minor version number changes always imply format changes that are compatible extensions.

## Organization of an OpenType Font

### Table Directory

The OpenType font starts with the table directory, which organizes the collection of tables. For single fonts, the table directory begins at byte 0 of the file.

TableDirectory:

| Type        | Name                    | Description                                                  |
|-------------|-------------------------|--------------------------------------------------------------|
| uint32      | sfntVersion             | 0x00010000 or 0x4F54544F ('OTTO')                            |
| uint16      | numTables               | Number of tables                                             |
| uint16      | searchRange             | Maximum power of 2 less than or equal to numTables, times 16 |
| uint16      | entrySelector           | Log2 of maximum power of 2 less than or equal to numTables   |
| uint16      | rangeShift              | numTables times 16, minus searchRange                        |
| TableRecord | tableRecords[numTables] | Table records array                                          |

## Font Collections

An OpenType Font Collection (TTC/OTC) allows multiple OpenType font resources in a single file structure, enabling shared tables between fonts. This is particularly useful when fonts share many glyphs in common, such as Japanese fonts sharing kanji glyphs while having unique kana designs.

### Font Collection File Structure

A font collection consists of:
- A single TTC header table
- One or more table directories
- OpenType tables

The TTC header must be at the beginning of the file, and each font resource must have a complete table directory.

### TTC Header

Two versions exist:
- Version 1.0: For TTC files without digital signatures
- Version 2.0: For TTC files with or without digital signatures

TTCHeader Version 1.0:

| Type     | Name                            | Description                        |
|----------|---------------------------------|------------------------------------|
| Tag      | ttcTag                          | Font Collection ID string: 'ttcf'  |
| uint16   | majorVersion                    | Major version = 1                  |
| uint16   | minorVersion                    | Minor version = 0                  |
| uint32   | numFonts                        | Number of fonts in TTC             |
| Offset32 | tableDirectoryOffsets[numFonts] | Array of offsets to TableDirectory |

TTCHeader Version 2.0 adds:

| Type   | Name       | Description                              |
|--------|------------|------------------------------------------|
| uint32 | dsigTag    | DSIG table tag (null if no signature)    |
| uint32 | dsigLength | DSIG table length (null if no signature) |
| uint32 | dsigOffset | DSIG table offset (null if no signature) |

## Font Tables

### Required Tables

| Tag  | Name                              |
|------|-----------------------------------|
| cmap | Character to glyph mapping        |
| head | Font header                       |
| hhea | Horizontal header                 |
| hmtx | Horizontal metrics                |
| maxp | Maximum profile                   |
| name | Naming table                      |
| OS/2 | OS/2 and Windows specific metrics |
| post | PostScript information            |

### TrueType Outline Tables

| Tag  | Name                                    |
|------|-----------------------------------------|
| cvt  | Control Value Table (optional)          |
| fpgm | Font program (optional)                 |
| glyf | Glyph data                              |
| loca | Index to location                       |
| prep | Control Value Program (optional)        |
| gasp | Grid-fitting/Scan-conversion (optional) |

### CFF Outline Tables

| Tag  | Name                       |
|------|----------------------------|
| CFF  | Compact Font Format 1.0    |
| CFF2 | Compact Font Format 2.0    |
| VORG | Vertical Origin (optional) |

### SVG Outline Table

| Tag | Name                                 |
|-----|--------------------------------------|
| SVG | SVG (Scalable Vector Graphics) table |

### Bitmap Tables

| Tag  | Name                          |
|------|-------------------------------|
| EBDT | Embedded bitmap data          |
| EBLC | Embedded bitmap location data |
| EBSC | Embedded bitmap scaling data  |
| CBDT | Color bitmap data             |
| CBLC | Color bitmap location data    |
| sbix | Standard bitmap graphics      |

### Color Font Tables

| Tag  | Name                       |
|------|----------------------------|
| COLR | Color table                |
| CPAL | Color palette table        |
| CBDT | Color bitmap data          |
| CBLC | Color bitmap location data |
| sbix | Standard bitmap graphics   |
| SVG  | SVG table                  |

### Advanced Typography Tables

| Tag  | Name                    |
|------|-------------------------|
| BASE | Baseline data           |
| GDEF | Glyph definition data   |
| GPOS | Glyph positioning data  |
| GSUB | Glyph substitution data |
| JSTF | Justification data      |
| MATH | Math layout data        |

### Other OpenType Tables

| Tag  | Name                                           |
|------|------------------------------------------------|
| DSIG | Digital signature                              |
| hdmx | Horizontal device metrics                      |
| kern | Kerning                                        |
| LTSH | Linear threshold data                          |
| MERG | Merge                                          |
| meta | Metadata                                       |
| STAT | Style attributes (required for variable fonts) |
| PCLT | PCL 5 data                                     |
| VDMX | Vertical device metrics                        |
| vhea | Vertical Metrics header                        |
| vmtx | Vertical Metrics                               |

Note: The STAT table is required in variable fonts. The hdmx and VDMX tables are not used in variable fonts.