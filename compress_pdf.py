"""
Script untuk mengkompresi file PDF menggunakan PyPDF2 dan Pillow
"""

import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zlib
from PyPDF2 import PdfReader, PdfWriter
from PyPDF2.generic import (
    ArrayObject,
    ByteStringObject,
    DecodedStreamObject,
    DictionaryObject,
    FloatObject,
    NameObject,
    NumberObject,
)
from PyPDF2._page import PageObject
from PIL import Image
import io


def _calc_jpeg_quality(image_quality):
    """
    Convert app quality scale (1-100) to JPEG quality (5-95).
    
    Mapping:
    1   -> JPEG 5   (maximum compression, very low quality)
    30  -> JPEG 20  (aggressive but still readable)
    49  -> JPEG 38  (just below the Low preset)
    50  -> JPEG 40  (Low preset)
    80  -> JPEG 73  (Good preset)
    90  -> JPEG 84  (High preset)
    """
    if image_quality >= 50:
        # Preset range: 50-100 -> JPEG 40-95
        q = int(40 + (image_quality - 50) * 1.1)
    else:
        # Custom range: 1-49 -> JPEG 5-38
        q = int(5 + (image_quality - 1) * (33 / 48))
    
    return max(5, min(95, q))


def compress_pdf_basic(input_path, output_path, compression_level='medium'):
    """
    Mengkompresi PDF dengan menghapus metadata dan mengoptimalkan struktur
    
    Args:
        input_path: Path ke file PDF input
        output_path: Path untuk menyimpan PDF yang sudah dikompresi
        compression_level: 'low', 'medium', atau 'high'
    """
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Copy semua halaman
        for page in reader.pages:
            # Kompresi konten halaman
            page.compress_content_streams()
            writer.add_page(page)
        
        # Hapus metadata untuk mengurangi ukuran
        writer.add_metadata({
            '/Producer': 'PDF Compressor',
            '/Creator': 'Python Script'
        })
        
        # Tulis file output
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        # Hitung persentase kompresi
        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        print(f"✓ Kompresi berhasil!")
        print(f"  Ukuran asli: {original_size / 1024:.2f} KB")
        print(f"  Ukuran terkompresi: {compressed_size / 1024:.2f} KB")
        print(f"  Pengurangan: {reduction:.2f}%")
        
        return True
        
    except Exception as e:
        print(f"✗ Error saat mengkompresi PDF: {str(e)}")
        return False


def compress_pdf_images(input_path, output_path, image_quality=50):
    """
    Mengkompresi PDF dengan mengkompresi gambar di dalamnya
    
    Args:
        input_path: Path ke file PDF input
        output_path: Path untuk menyimpan PDF yang sudah dikompresi
        image_quality: Kualitas gambar (1-100, semakin rendah semakin kecil ukuran)
    
    Note: Gambar yang tidak bisa dikompres akan dipertahankan dalam bentuk aslinya
    """
    try:
        print(f"  Membaca PDF...")
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        print(f"  Total halaman: {total_pages}")
        print(f"  Kualitas kompresi: {image_quality}%")
        
        for page_num, page in enumerate(reader.pages, 1):
            print(f"  Memproses halaman {page_num}/{total_pages}...", end='\r')
            
            # Kompresi konten halaman
            try:
                page.compress_content_streams()
            except Exception:
                pass  # Ignore errors
            
            # Kompresi gambar dalam halaman
            if '/Resources' in page and '/XObject' in page['/Resources']:
                xobjects = page['/Resources']['/XObject'].get_object()
                
                for obj_name in xobjects:
                    obj = xobjects[obj_name]
                    
                    # Cek apakah object adalah gambar
                    if obj['/Subtype'] == '/Image':
                        try:
                            # Extract image data
                            if '/Filter' in obj:
                                filter_type = obj['/Filter']
                                
                                # Handle DCTDecode (JPEG) images
                                if filter_type == '/DCTDecode' or (isinstance(filter_type, list) and '/DCTDecode' in filter_type):
                                    # Get image data
                                    data = obj.get_data()
                                    
                                    # Convert to PIL Image
                                    img = Image.open(io.BytesIO(data))
                                    
                                    # Ensure compatible mode for JPEG
                                    if img.mode not in ('RGB', 'L', 'CMYK'):
                                        img = img.convert('RGB')
                                    
                                    # Calculate JPEG quality using helper function
                                    jpeg_quality = _calc_jpeg_quality(image_quality)
                                    
                                    # Prepare compressed image
                                    img_byte_arr = io.BytesIO()
                                    img.save(img_byte_arr, format='JPEG', quality=jpeg_quality, optimize=True)
                                    new_data = img_byte_arr.getvalue()
                                    
                                    # Apply all changes at once (Bug #4 fix)
                                    obj._data = new_data
                                    obj[NameObject('/Length')] = NumberObject(len(new_data))
                                
                                # Handle FlateDecode (PNG-like) images
                                elif filter_type == '/FlateDecode' or (isinstance(filter_type, list) and '/FlateDecode' in filter_type):
                                    try:
                                        data = obj.get_data()
                                        
                                        # Get image properties
                                        width = int(obj['/Width'])
                                        height = int(obj['/Height'])
                                        
                                        # Try to create image
                                        if '/ColorSpace' in obj:
                                            color_space = obj['/ColorSpace']
                                            
                                            # Resolve object reference if needed
                                            if hasattr(color_space, 'get_object'):
                                                color_space = color_space.get_object()
                                            
                                            # Bug #2 fix: Handle array color spaces
                                            if isinstance(color_space, list):
                                                cs_name = str(color_space[0]) if color_space else ''
                                            else:
                                                cs_name = str(color_space) if color_space else ''
                                            
                                            # Bug #3 fix: Validate data size before Image.frombytes()
                                            if cs_name == '/DeviceRGB':
                                                expected = width * height * 3
                                                if len(data) < expected:
                                                    continue  # Skip, keep original
                                                img = Image.frombytes('RGB', (width, height), data[:expected])
                                            elif cs_name == '/DeviceGray':
                                                expected = width * height
                                                if len(data) < expected:
                                                    continue  # Skip, keep original
                                                img = Image.frombytes('L', (width, height), data[:expected])
                                            elif cs_name == '/DeviceCMYK':
                                                expected = width * height * 4
                                                if len(data) < expected:
                                                    continue  # Skip, keep original
                                                img = Image.frombytes('CMYK', (width, height), data[:expected])
                                            else:
                                                # Bug #1 fix: Unsupported color space - keep original
                                                # Do NOT modify the object at all
                                                continue
                                            
                                            # Calculate JPEG quality using helper function
                                            jpeg_quality = _calc_jpeg_quality(image_quality)
                                            
                                            # Prepare compressed image
                                            img_byte_arr = io.BytesIO()
                                            img.save(img_byte_arr, format='JPEG', quality=jpeg_quality, optimize=True)
                                            new_data = img_byte_arr.getvalue()
                                            
                                            # Bug #4 fix: Apply all changes at once
                                            obj._data = new_data
                                            obj[NameObject('/Filter')] = NameObject('/DCTDecode')
                                            obj[NameObject('/Length')] = NumberObject(len(new_data))
                                            
                                            # Bug #5 fix: Remove DecodeParms after conversion
                                            if '/DecodeParms' in obj:
                                                del obj['/DecodeParms']
                                    except:
                                        pass  # Skip if can't process, keep original
                        except Exception:
                            pass  # Skip problematic images, keep original
            
            writer.add_page(page)
        
        print(f"\n  Menyimpan PDF terkompresi...")
        
        # Set compression for writer
        writer.add_metadata({
            '/Producer': f'PDF Compressor (Quality: {image_quality}%)',
            '/Creator': 'Python Script'
        })
        
        # Tulis file output dengan compression
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        # Hitung persentase kompresi
        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        print(f"\n✓ Kompresi berhasil!")
        print(f"  Ukuran asli: {original_size / (1024*1024):.2f} MB ({original_size / 1024:.2f} KB)")
        print(f"  Ukuran terkompresi: {compressed_size / (1024*1024):.2f} MB ({compressed_size / 1024:.2f} KB)")
        print(f"  Pengurangan: {reduction:.2f}%")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error saat mengkompresi PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# =====================================================================
# Ghostscript engine
# =====================================================================

def find_ghostscript():
    """
    Mencari binary Ghostscript.

    Urutan pencarian:
      1. Env var MICROPDF_GS (di-set oleh Electron saat app di-package)
      2. Folder vendor/ di dalam project (hasil build/dev)
      3. PATH sistem
      4. Lokasi instalasi umum di Windows

    Returns:
        str path ke binary, atau None kalau tidak ketemu
    """
    # 1. Explicit override
    env_gs = os.environ.get('MICROPDF_GS')
    if env_gs and os.path.isfile(env_gs):
        return env_gs

    names = ['gswin64c.exe', 'gswin32c.exe'] if os.name == 'nt' else ['gs']

    # 2. Bundled copy - relatif terhadap file ini, dan terhadap resourcesPath Electron
    roots = [os.path.dirname(os.path.abspath(__file__))]
    if getattr(sys, 'frozen', False):
        roots.append(os.path.dirname(sys.executable))
    for root in roots:
        for name in names:
            candidate = os.path.join(root, 'vendor', 'ghostscript', 'bin', name)
            if os.path.isfile(candidate):
                return candidate

    # 3. PATH
    for name in names:
        found = shutil.which(name)
        if found:
            return found

    # 4. Instalasi umum Windows
    if os.name == 'nt':
        for base in (r'C:\Program Files\gs', r'C:\Program Files (x86)\gs'):
            if not os.path.isdir(base):
                continue
            for version in sorted(os.listdir(base), reverse=True):
                for name in names:
                    candidate = os.path.join(base, version, 'bin', name)
                    if os.path.isfile(candidate):
                        return candidate

    return None


# Titik kalibrasi skala kualitas app (1-100) -> resolusi gambar target (dpi).
#
# Disejajarkan dengan konvensi preset Ghostscript: /screen = 72 dpi,
# /ebook = 150 dpi, /printer = 300 dpi. Ini penting - pdfwrite menulis ulang
# content stream, dan pada dpi tinggi hasil tulis ulang itu bisa lebih besar
# daripada aslinya. Pada PDF vektor 46.9 MB, 218 dpi menghasilkan 50.12 MB
# (membengkak 7%) sedangkan 150 dpi menghasilkan 44.79 MB (turun 4.5%).
_DPI_ANCHORS = [
    (1, 50),      # kompresi ekstrem
    (50, 72),     # Low     - setara /screen
    (60, 96),     # Fair
    (70, 120),    # Medium
    (80, 150),    # Good    - setara /ebook
    (90, 220),    # High
    (100, 300),   # setara /printer
]


def _gs_params(image_quality):
    """
    Menerjemahkan skala kualitas app (1-100) ke parameter Ghostscript.

    Returns:
        tuple (dpi, jpeg_quality)
    """
    q = max(1, min(100, int(image_quality)))

    # Interpolasi linier antar titik kalibrasi
    dpi = _DPI_ANCHORS[-1][1]
    for (q_low, dpi_low), (q_high, dpi_high) in zip(_DPI_ANCHORS, _DPI_ANCHORS[1:]):
        if q <= q_high:
            span = q_high - q_low
            dpi = dpi_low + (q - q_low) * (dpi_high - dpi_low) / span
            break
    dpi = int(round(dpi))

    # Pakai kurva JPEG yang sama dengan engine images, dibatasi ke rentang aman gs
    jpeg_quality = max(30, min(90, _calc_jpeg_quality(q)))

    return dpi, jpeg_quality


def compress_pdf_ghostscript(input_path, output_path, image_quality=80, gs_binary=None):
    """
    Mengkompresi PDF menggunakan Ghostscript.

    Kuat untuk PDF vektor/teks karena pdfwrite menulis ulang content stream -
    sesuatu yang tidak bisa disentuh oleh engine berbasis gambar.

    Args:
        input_path: Path ke file PDF input
        output_path: Path untuk menyimpan hasil
        image_quality: Kualitas gambar (1-100)
        gs_binary: Path ke binary gs (opsional, akan dicari otomatis)

    Returns:
        bool: True jika gs selesai dengan sukses. Output TETAP harus divalidasi
              dengan validate_output() - gs bisa keluar dengan error tapi tetap
              menulis PDF yang tidak lengkap.
    """
    gs = gs_binary or find_ghostscript()
    if not gs:
        print("  Ghostscript tidak ditemukan, engine ini dilewati")
        return False

    dpi, jpeg_quality = _gs_params(image_quality)
    print(f"  Ghostscript: {dpi} dpi, JPEG q{jpeg_quality}")

    args = [
        gs,
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.7',
        '-dNOPAUSE', '-dBATCH', '-dQUIET', '-dSAFER',

        # Downsampling gambar
        '-dDownsampleColorImages=true',
        '-dColorImageDownsampleType=/Bicubic',
        f'-dColorImageResolution={dpi}',
        '-dDownsampleGrayImages=true',
        '-dGrayImageDownsampleType=/Bicubic',
        f'-dGrayImageResolution={dpi}',
        '-dDownsampleMonoImages=true',
        '-dMonoImageDownsampleType=/Subsample',
        f'-dMonoImageResolution={dpi * 4}',

        # Paksa JPEG dengan kualitas terkontrol
        '-dAutoFilterColorImages=false',
        '-dColorImageFilter=/DCTEncode',
        '-dAutoFilterGrayImages=false',
        '-dGrayImageFilter=/DCTEncode',
        f'-dJPEGQ={jpeg_quality}',

        # Optimasi struktur
        '-dCompressFonts=true',
        '-dSubsetFonts=true',
        '-dDetectDuplicateImages=true',

        f'-sOutputFile={output_path}',
        input_path,
    ]

    try:
        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=600,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
    except subprocess.TimeoutExpired:
        print("  Ghostscript timeout (>600 detik)")
        return False
    except Exception as e:
        print(f"  Ghostscript gagal dijalankan: {e}")
        return False

    if result.returncode != 0:
        detail = (result.stdout or b'').decode('utf-8', 'replace').strip().splitlines()
        tail = detail[-1] if detail else f'exit code {result.returncode}'
        print(f"  Ghostscript error: {tail}")
        return False

    return True


# =====================================================================
# Raster engine (halaman vektor tanpa teks)
# =====================================================================

# Banyak PDF hasil "print to PDF" dari aplikasi desktop menuliskan teksnya
# sebagai outline - ribuan operator path, bukan operator teks. Halaman seperti
# itu adalah gambar garis yang menyamar jadi vektor: engine images tidak bisa
# menyentuhnya (tidak ada XObject gambar) dan Ghostscript menulis ulang path-nya
# kira-kira seukuran aslinya. Pada SPT 206 halaman, 131 halaman semacam ini
# memakan 32.87 MB dari 46.90 MB dan kedua engine lama mentok di 4.5%.
#
# Dirender ke gambar indexed-color 150 dpi, halaman yang sama jadi ~43 KB -
# delapan kali lebih kecil, dan tidak ada teks yang hilang karena memang tidak
# pernah ada teks yang bisa diseleksi di sana. JPEG justru lebih besar daripada
# aslinya: kompresi lossy membenci tepi tajam hitam-putih.

_RASTER_DPI = 150                    # tetap tajam untuk cetak A4 dan zoom 200%
_RASTER_MIN_RAW_BYTES = 150 * 1024   # halaman di bawah ini tidak sepadan dirender
_RASTER_MAX_TEXT_OPS = 20            # di atas ini anggap halaman punya teks asli
_RASTER_MIN_SHARE = 0.25             # minimal porsi file, kalau tidak engine dilewati

_TEXT_OP_RE = re.compile(rb'(?:Tj|TJ|\'|\")[\s\r\n]')


def _raw_content_bytes(page):
    """Ukuran content stream halaman apa adanya, tanpa didekompresi."""
    contents = page.get('/Contents')
    if contents is None:
        return 0
    items = contents if isinstance(contents, list) else [contents]
    total = 0
    for item in items:
        try:
            total += len(getattr(item.get_object(), '_data', b''))
        except Exception:
            pass
    return total


def _count_text_ops(page, probe_bytes=256 * 1024):
    """
    Menghitung operator penulis teks di content stream halaman.

    Hanya mendekompresi potongan awal: satu halaman berat bisa mengembang jadi
    lebih dari 1 MB, dan mendekompresi 131 halaman utuh hanya untuk mendeteksi
    saja sudah memakan waktu lebih lama daripada rendernya.
    """
    contents = page.get('/Contents')
    if contents is None:
        return 0
    items = contents if isinstance(contents, list) else [contents]

    count = 0
    for item in items:
        try:
            obj = item.get_object()
            raw = getattr(obj, '_data', b'')
            filt = obj.get('/Filter')
            filt = str(filt.get_object()) if hasattr(filt, 'get_object') else str(filt)

            if '/FlateDecode' in filt and '/DecodeParms' not in obj:
                head = zlib.decompressobj().decompress(raw, probe_bytes)
            else:
                head = obj.get_data()[:probe_bytes]

            count += len(_TEXT_OP_RE.findall(head))
        except Exception:
            # Tidak terbaca berarti tidak bisa dipastikan aman - anggap ada teks
            return _RASTER_MAX_TEXT_OPS + 1

    return count


def detect_outline_pages(reader):
    """
    Mencari halaman yang isinya vektor berat tanpa teks yang bisa diseleksi.

    Returns:
        tuple (nomor halaman 1-based, jumlah byte content yang dicakup)
    """
    pages, covered = [], 0
    for index, page in enumerate(reader.pages, 1):
        raw = _raw_content_bytes(page)
        if raw < _RASTER_MIN_RAW_BYTES:
            continue
        if _count_text_ops(page) > _RASTER_MAX_TEXT_OPS:
            continue
        pages.append(index)
        covered += raw
    return pages, covered


def _png_to_pdf_image(png_bytes):
    """
    Membongkar PNG indexed 8-bit jadi bahan XObject gambar PDF.

    Bagian IDAT sebuah PNG adalah scanline ter-filter yang di-deflate - persis
    yang dimaksud PDF dengan /FlateDecode + /Predictor 15. Jadi datanya bisa
    dipindahkan mentah-mentah, tanpa dekode ulang, dan filter baris PNG (yang
    dikerjakan Pillow di C) ikut terbawa. Tanpa itu, halaman yang sama membengkak
    dari 43 KB jadi hampir 5 MB.

    Returns:
        dict berisi data, palet, dimensi - atau None kalau PNG-nya tak terduga
    """
    if png_bytes[:8] != b'\x89PNG\r\n\x1a\n':
        return None

    pos = 8
    palette, idat = None, bytearray()
    width = height = bit_depth = color_type = None

    while pos + 8 <= len(png_bytes):
        length, ctype = struct.unpack('>I4s', png_bytes[pos:pos + 8])
        body = png_bytes[pos + 8:pos + 8 + length]
        pos += 12 + length  # header + data + CRC

        if ctype == b'IHDR':
            width, height, bit_depth, color_type = struct.unpack('>IIBB', body[:10])
            interlace = body[12]
            if interlace or color_type != 3:  # harus indexed & non-interlaced
                return None
        elif ctype == b'PLTE':
            palette = body
        elif ctype == b'IDAT':
            idat.extend(body)
        elif ctype == b'IEND':
            break

    if not (palette and idat and width and height):
        return None

    return {
        'data': bytes(idat),
        'palette': palette,
        'width': width,
        'height': height,
        'bits': bit_depth,
    }


def _build_image_page(writer, image, dpi):
    """Membuat satu halaman PDF yang isinya persis satu gambar full-bleed."""
    width_pt = image['width'] * 72.0 / dpi
    height_pt = image['height'] * 72.0 / dpi

    xobject = DecodedStreamObject()
    xobject._data = image['data']
    xobject.update({
        NameObject('/Type'): NameObject('/XObject'),
        NameObject('/Subtype'): NameObject('/Image'),
        NameObject('/Width'): NumberObject(image['width']),
        NameObject('/Height'): NumberObject(image['height']),
        NameObject('/BitsPerComponent'): NumberObject(image['bits']),
        NameObject('/ColorSpace'): ArrayObject([
            NameObject('/Indexed'),
            NameObject('/DeviceRGB'),
            NumberObject(len(image['palette']) // 3 - 1),
            ByteStringObject(image['palette']),
        ]),
        NameObject('/Filter'): NameObject('/FlateDecode'),
        NameObject('/DecodeParms'): DictionaryObject({
            NameObject('/Predictor'): NumberObject(15),
            NameObject('/Colors'): NumberObject(1),
            NameObject('/BitsPerComponent'): NumberObject(image['bits']),
            NameObject('/Columns'): NumberObject(image['width']),
        }),
        NameObject('/Length'): NumberObject(len(image['data'])),
    })

    contents = DecodedStreamObject()
    contents.set_data(f'q {width_pt:.4f} 0 0 {height_pt:.4f} 0 0 cm /Im0 Do Q'.encode('ascii'))

    page = PageObject.create_blank_page(width=width_pt, height=height_pt)
    page[NameObject('/Resources')] = DictionaryObject({
        NameObject('/XObject'): DictionaryObject({
            NameObject('/Im0'): writer._add_object(xobject),
        }),
    })
    page[NameObject('/Contents')] = writer._add_object(contents)
    return page


def _render_pages(input_path, page_numbers, dpi, out_dir, gs_binary=None):
    """Merender halaman terpilih jadi PNG lewat Ghostscript (-sPageList)."""
    gs = gs_binary or find_ghostscript()
    if not gs:
        return []

    pattern = os.path.join(out_dir, 'page_%04d.png')
    args = [
        gs,
        '-sDEVICE=png16m',
        f'-r{dpi}',
        '-dNOPAUSE', '-dBATCH', '-dQUIET', '-dSAFER',
        f'-sPageList={",".join(str(n) for n in page_numbers)}',
        f'-sOutputFile={pattern}',
        input_path,
    ]

    try:
        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=1800,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
    except subprocess.TimeoutExpired:
        print("  Render timeout (>1800 detik)")
        return []
    except Exception as e:
        print(f"  Render gagal dijalankan: {e}")
        return []

    if result.returncode != 0:
        detail = (result.stdout or b'').decode('utf-8', 'replace').strip().splitlines()
        print(f"  Render error: {detail[-1] if detail else result.returncode}")
        return []

    return sorted(
        os.path.join(out_dir, name)
        for name in os.listdir(out_dir)
        if name.startswith('page_') and name.endswith('.png')
    )


def compress_pdf_raster(input_path, output_path, dpi=150, colors=16, gs_binary=None):
    """
    Mengganti halaman vektor-tanpa-teks dengan gambar indexed-color.

    Halaman lain disalin apa adanya, jadi teks yang bisa diseleksi tetap utuh.

    Args:
        input_path: Path ke file PDF input
        output_path: Path untuk menyimpan hasil
        dpi: Resolusi render (150 dpi tetap tajam untuk cetak A4 dan zoom 200%)
        colors: Ukuran palet setelah kuantisasi
        gs_binary: Path ke binary gs (opsional)

    Returns:
        bool: True kalau file output berhasil ditulis. Tetap harus divalidasi
              dengan validate_output().
    """
    reader = PdfReader(input_path)
    total_pages = len(reader.pages)

    print("  Memeriksa halaman...")
    targets, covered = detect_outline_pages(reader)

    if not targets:
        print("  Tidak ada halaman vektor-tanpa-teks, engine ini dilewati")
        return False

    share = covered / max(1, os.path.getsize(input_path))
    if share < _RASTER_MIN_SHARE:
        print(f"  Halaman semacam itu hanya {share * 100:.0f}% file, engine ini dilewati")
        return False

    print(f"  {len(targets)}/{total_pages} halaman dirender ulang "
          f"({covered / 1048576:.2f} MB, {dpi} dpi, {colors} warna)")

    temp_dir = tempfile.mkdtemp(prefix='micropdf_raster_')
    try:
        rendered = _render_pages(input_path, targets, dpi, temp_dir, gs_binary=gs_binary)
        if len(rendered) != len(targets):
            print(f"  Render tidak lengkap ({len(rendered)}/{len(targets)}), engine ini dilewati")
            return False

        writer = PdfWriter()
        replacement = {}

        for position, (page_number, png_path) in enumerate(zip(targets, rendered), 1):
            print(f"  Merender halaman {position}/{len(targets)}...", end='\r')

            with Image.open(png_path) as source:
                quantized = source.convert('RGB').quantize(colors=colors)
                buffer = io.BytesIO()
                quantized.save(buffer, format='PNG', optimize=True)

            image = _png_to_pdf_image(buffer.getvalue())
            if image:
                replacement[page_number] = image
            os.remove(png_path)

        print(f"\n  Menyimpan PDF terkompresi...")

        for index, page in enumerate(reader.pages, 1):
            image = replacement.get(index)
            if image:
                writer.add_page(_build_image_page(writer, image, dpi))
            else:
                try:
                    page.compress_content_streams()
                except Exception:
                    pass
                writer.add_page(page)

        writer.add_metadata({
            '/Producer': f'microPDF (raster {dpi} dpi)',
            '/Creator': 'microPDF',
        })

        with open(output_path, 'wb') as handle:
            writer.write(handle)

        return True

    except Exception as e:
        print(f"  Engine raster gagal: {e}")
        return False
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


# =====================================================================
# Validasi hasil
# =====================================================================

def validate_output(input_path, output_path):
    """
    Memastikan PDF hasil kompresi benar-benar layak dipakai.

    Ghostscript bisa keluar dengan error namun tetap menulis file - pada file uji
    31 MB / 286 halaman ia menghasilkan stub 20 KB berisi 1 halaman. Tanpa
    pengecekan jumlah halaman, itu akan terlihat seperti "kompresi 99.9% berhasil".

    Args:
        input_path: PDF sumber
        output_path: PDF kandidat hasil kompresi

    Returns:
        tuple (ok: bool, alasan: str)
    """
    if not os.path.exists(output_path):
        return False, 'file output tidak dibuat'

    out_size = os.path.getsize(output_path)
    if out_size == 0:
        return False, 'file output kosong'

    in_size = os.path.getsize(input_path)
    if out_size >= in_size:
        return False, f'tidak lebih kecil ({out_size / 1048576:.2f} MB vs {in_size / 1048576:.2f} MB)'

    try:
        source_pages = len(PdfReader(input_path).pages)
        result_pages = len(PdfReader(output_path).pages)
    except Exception as e:
        return False, f'output tidak bisa dibaca: {e}'

    if result_pages != source_pages:
        return False, f'jumlah halaman berubah ({result_pages} vs {source_pages})'

    return True, 'ok'


# =====================================================================
# Hybrid orchestrator
# =====================================================================

def compress_pdf_hybrid(input_path, output_path, image_quality=80):
    """
    Menjalankan kedua engine, memvalidasi hasilnya, lalu memakai yang terkecil.

    Alasan hybrid: tidak ada satu engine yang menang di semua jenis PDF.
      - PDF scan (dominan gambar): engine images jauh lebih unggul, dan pada
        beberapa file Ghostscript justru gagal total.
      - PDF vektor/teks: engine images nyaris tidak berpengaruh karena hanya
        menyentuh XObject gambar, sedangkan gs menulis ulang content stream.

    Kandidat yang gagal validasi dibuang. Kalau tidak ada kandidat yang lolos,
    file asli disalin apa adanya - PDF tersebut memang sudah teroptimasi.

    Args:
        input_path: Path ke file PDF input
        output_path: Path untuk menyimpan hasil
        image_quality: Kualitas gambar (1-100)

    Returns:
        bool: True jika file output berhasil ditulis
    """
    original_size = os.path.getsize(input_path)
    print(f"  Membaca PDF...")
    print(f"  Ukuran asli: {original_size / (1024 * 1024):.2f} MB")

    temp_dir = tempfile.mkdtemp(prefix='micropdf_')
    candidates = []

    try:
        # --- Engine 1: kompresi gambar (PyPDF2 + Pillow) ---
        print(f"\n  [1/3] Engine images...")
        images_out = os.path.join(temp_dir, 'images.pdf')
        try:
            if compress_pdf_images(input_path, images_out, image_quality=image_quality):
                ok, reason = validate_output(input_path, images_out)
                size = os.path.getsize(images_out) if os.path.exists(images_out) else 0
                if ok:
                    candidates.append(('images', images_out, size))
                    print(f"  -> {size / (1024 * 1024):.2f} MB, valid")
                else:
                    print(f"  -> ditolak: {reason}")
        except Exception as e:
            print(f"  -> engine images gagal: {e}")

        # --- Engine 2: Ghostscript ---
        print(f"\n  [2/3] Engine Ghostscript...")
        gs_out = os.path.join(temp_dir, 'gs.pdf')
        try:
            if compress_pdf_ghostscript(input_path, gs_out, image_quality=image_quality):
                ok, reason = validate_output(input_path, gs_out)
                size = os.path.getsize(gs_out) if os.path.exists(gs_out) else 0
                if ok:
                    candidates.append(('ghostscript', gs_out, size))
                    print(f"  -> {size / (1024 * 1024):.2f} MB, valid")
                else:
                    print(f"  -> ditolak: {reason}")
        except Exception as e:
            print(f"  -> engine Ghostscript gagal: {e}")

        # --- Engine 3: raster untuk halaman vektor tanpa teks ---
        print(f"\n  [3/3] Engine raster...")
        raster_out = os.path.join(temp_dir, 'raster.pdf')
        try:
            if compress_pdf_raster(input_path, raster_out, dpi=_RASTER_DPI):
                ok, reason = validate_output(input_path, raster_out)
                size = os.path.getsize(raster_out) if os.path.exists(raster_out) else 0
                if ok:
                    candidates.append(('raster', raster_out, size))
                    print(f"  -> {size / (1024 * 1024):.2f} MB, valid")
                else:
                    print(f"  -> ditolak: {reason}")
        except Exception as e:
            print(f"  -> engine raster gagal: {e}")

        # --- Pilih pemenang ---
        print(f"\n  Menyimpan PDF terkompresi...")

        if candidates:
            winner_name, winner_path, winner_size = min(candidates, key=lambda c: c[2])
            shutil.copyfile(winner_path, output_path)
            reduction = ((original_size - winner_size) / original_size) * 100
            print(f"\n✓ Kompresi berhasil! (engine: {winner_name})")
            print(f"  Ukuran asli: {original_size / (1024 * 1024):.2f} MB")
            print(f"  Ukuran terkompresi: {winner_size / (1024 * 1024):.2f} MB")
            print(f"  Pengurangan: {reduction:.2f}%")
            return True

        # Tidak ada engine yang menghasilkan output lebih kecil dan valid
        shutil.copyfile(input_path, output_path)
        print(f"\n✓ PDF ini sudah teroptimasi - tidak ada kompresi yang menguntungkan.")
        print(f"  File disalin apa adanya: {original_size / (1024 * 1024):.2f} MB")
        return True

    except Exception as e:
        print(f"\n✗ Error saat mengkompresi PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def batch_compress_pdfs(input_folder, output_folder, method='basic'):
    """
    Mengkompresi semua file PDF dalam folder
    
    Args:
        input_folder: Folder yang berisi file PDF
        output_folder: Folder untuk menyimpan hasil kompresi
        method: 'hybrid', 'images', atau 'basic'
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    pdf_files = [f for f in os.listdir(input_folder) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print("Tidak ada file PDF ditemukan di folder input.")
        return
    
    print(f"\nMemproses {len(pdf_files)} file PDF...\n")
    
    for pdf_file in pdf_files:
        input_path = os.path.join(input_folder, pdf_file)
        output_path = os.path.join(output_folder, f"compressed_{pdf_file}")
        
        print(f"Memproses: {pdf_file}")
        
        if method == 'hybrid':
            compress_pdf_hybrid(input_path, output_path)
        elif method == 'images':
            compress_pdf_images(input_path, output_path)
        else:
            compress_pdf_basic(input_path, output_path)
        
        print()


if __name__ == "__main__":
    # Contoh penggunaan
    print("=" * 60)
    print("PDF Compressor - Script Kompresi PDF")
    print("=" * 60)
    
    # Contoh 1: Kompresi satu file
    # compress_pdf_basic('input.pdf', 'output_compressed.pdf')
    
    # Contoh 2: Kompresi dengan optimasi gambar
    # compress_pdf_images('input.pdf', 'output_compressed.pdf', image_quality=60)
    
    # Contoh 3: Kompresi batch semua PDF dalam folder
    # batch_compress_pdfs('input_folder', 'output_folder', method='basic')
    
    print("\nEdit script ini untuk menggunakan fungsi yang Anda butuhkan.")
    print("Uncomment salah satu contoh di atas atau buat kode Anda sendiri.")


def compress_pdf_safe(input_path, output_path, quality=75):
    """
    Kompresi PDF yang aman tanpa merusak konten
    Metode ini hanya mengoptimalkan struktur PDF tanpa manipulasi gambar
    
    Args:
        input_path: Path ke file PDF input
        output_path: Path untuk menyimpan PDF yang sudah dikompresi
        quality: Kualitas (1-100) - hanya mempengaruhi metadata removal
    
    Returns:
        bool: True jika berhasil, False jika gagal
    """
    try:
        print(f"  Membaca PDF: {input_path}")
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        print(f"  Total halaman: {total_pages}")
        
        # Copy semua halaman dengan kompresi stream
        for page_num, page in enumerate(reader.pages, 1):
            print(f"  Memproses halaman {page_num}/{total_pages}...", end='\r')
            
            # Kompresi content streams (aman)
            try:
                page.compress_content_streams()
            except:
                pass  # Jika gagal, lanjutkan tanpa kompresi
            
            writer.add_page(page)
        
        print(f"\n  Menyimpan PDF...")
        
        # Remove metadata jika quality rendah
        if quality < 80:
            writer.add_metadata({
                '/Producer': 'PDF Compressor',
                '/Creator': 'Python Script'
            })
        
        # Tulis file output
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        # Statistik
        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        print(f"\n✓ Kompresi selesai!")
        print(f"  Ukuran asli: {original_size / (1024*1024):.2f} MB")
        print(f"  Ukuran hasil: {compressed_size / (1024*1024):.2f} MB")
        print(f"  Pengurangan: {reduction:.2f}%")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
