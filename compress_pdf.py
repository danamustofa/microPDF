"""
Script untuk mengkompresi file PDF menggunakan PyPDF2 dan Pillow
"""

import os
from PyPDF2 import PdfReader, PdfWriter
from PyPDF2.generic import NameObject, NumberObject
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


def batch_compress_pdfs(input_folder, output_folder, method='basic'):
    """
    Mengkompresi semua file PDF dalam folder
    
    Args:
        input_folder: Folder yang berisi file PDF
        output_folder: Folder untuk menyimpan hasil kompresi
        method: 'basic' atau 'images'
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
        
        if method == 'images':
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
