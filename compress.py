"""
PDF Compressor - Script Dinamis untuk Kompresi PDF
Mendukung berbagai mode: interaktif, single file, batch processing
"""

import os
import sys
from compress_pdf import compress_pdf_images
from pathlib import Path


def clear_screen():
    """Clear terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def get_pdf_files_in_folder(folder_path):
    """Mendapatkan semua file PDF dalam folder"""
    if not os.path.exists(folder_path):
        return []
    return [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]


def format_size(size_bytes):
    """Format ukuran file ke MB atau KB"""
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024*1024):.2f} MB"
    else:
        return f"{size_bytes / 1024:.2f} KB"


def compress_single_file(input_path, output_path=None, quality=75):
    """
    Kompresi satu file PDF
    
    Args:
        input_path: Path file PDF input
        output_path: Path file output (opsional, akan auto-generate jika None)
        quality: Kualitas kompresi (1-100)
    """
    # Validasi input file
    if not os.path.exists(input_path):
        print(f"✗ Error: File tidak ditemukan: {input_path}")
        return False
    
    # Auto-generate output path jika tidak disediakan
    if output_path is None:
        input_dir = os.path.dirname(input_path)
        input_filename = os.path.basename(input_path)
        output_filename = f"compressed_{input_filename}"
        output_path = os.path.join(input_dir, output_filename)
    
    # Pastikan folder output ada
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    print('=' * 70)
    print(f'Kompresi PDF - Kualitas {quality}%')
    print('=' * 70)
    print(f'Input : {input_path}')
    print(f'Output: {output_path}')
    print(f'Kualitas: {quality}%\n')
    
    # Jalankan kompresi
    success = compress_pdf_images(input_path, output_path, image_quality=quality)
    
    if success:
        print('\n' + '=' * 70)
        print('✓ Kompresi selesai!')
        print('=' * 70)
    
    return success


def compress_batch(input_folder, output_folder=None, quality=75):
    """
    Kompresi semua file PDF dalam folder
    
    Args:
        input_folder: Folder berisi file PDF
        output_folder: Folder output (opsional, default: input_folder/compressed)
        quality: Kualitas kompresi (1-100)
    """
    # Validasi input folder
    if not os.path.exists(input_folder):
        print(f"✗ Error: Folder tidak ditemukan: {input_folder}")
        return False
    
    # Auto-generate output folder jika tidak disediakan
    if output_folder is None:
        output_folder = os.path.join(input_folder, 'compressed')
    
    # Pastikan folder output ada
    os.makedirs(output_folder, exist_ok=True)
    
    # Dapatkan semua file PDF
    pdf_files = get_pdf_files_in_folder(input_folder)
    
    if not pdf_files:
        print(f"✗ Tidak ada file PDF ditemukan di: {input_folder}")
        return False
    
    print('=' * 70)
    print(f'Batch Kompresi PDF - {len(pdf_files)} file')
    print('=' * 70)
    print(f'Input folder : {input_folder}')
    print(f'Output folder: {output_folder}')
    print(f'Kualitas     : {quality}%\n')
    
    success_count = 0
    failed_count = 0
    
    for i, pdf_file in enumerate(pdf_files, 1):
        input_path = os.path.join(input_folder, pdf_file)
        output_path = os.path.join(output_folder, f"compressed_{pdf_file}")
        
        print(f"\n[{i}/{len(pdf_files)}] Memproses: {pdf_file}")
        print('-' * 70)
        
        success = compress_pdf_images(input_path, output_path, image_quality=quality)
        
        if success:
            success_count += 1
        else:
            failed_count += 1
    
    # Summary
    print('\n' + '=' * 70)
    print('Batch Kompresi Selesai!')
    print('=' * 70)
    print(f'✓ Berhasil: {success_count} file')
    if failed_count > 0:
        print(f'✗ Gagal   : {failed_count} file')
    print(f'\nFile hasil tersimpan di: {output_folder}')
    
    return True


def interactive_mode():
    """Mode interaktif dengan menu"""
    while True:
        clear_screen()
        print('=' * 70)
        print('PDF COMPRESSOR - Mode Interaktif')
        print('=' * 70)
        print('\nPilih mode kompresi:')
        print('  1. Kompresi satu file')
        print('  2. Kompresi batch (semua PDF dalam folder)')
        print('  3. Kompresi file di folder input/')
        print('  4. Keluar')
        print()
        
        choice = input('Pilihan Anda (1-4): ').strip()
        
        if choice == '1':
            # Single file mode
            print('\n' + '-' * 70)
            print('MODE: Kompresi Satu File')
            print('-' * 70)
            
            input_path = input('\nMasukkan path file PDF input: ').strip().strip('"\'')
            
            if not input_path:
                print('✗ Path tidak boleh kosong!')
                input('\nTekan Enter untuk kembali...')
                continue
            
            output_path = input('Masukkan path output (kosongkan untuk auto): ').strip().strip('"\'')
            if not output_path:
                output_path = None
            
            quality_input = input('Masukkan kualitas (1-100, default 75): ').strip()
            quality = int(quality_input) if quality_input.isdigit() else 75
            quality = max(1, min(100, quality))  # Clamp antara 1-100
            
            print()
            compress_single_file(input_path, output_path, quality)
            
            input('\nTekan Enter untuk kembali ke menu...')
        
        elif choice == '2':
            # Batch mode
            print('\n' + '-' * 70)
            print('MODE: Kompresi Batch')
            print('-' * 70)
            
            input_folder = input('\nMasukkan path folder input: ').strip().strip('"\'')
            
            if not input_folder:
                print('✗ Path tidak boleh kosong!')
                input('\nTekan Enter untuk kembali...')
                continue
            
            output_folder = input('Masukkan path folder output (kosongkan untuk auto): ').strip().strip('"\'')
            if not output_folder:
                output_folder = None
            
            quality_input = input('Masukkan kualitas (1-100, default 75): ').strip()
            quality = int(quality_input) if quality_input.isdigit() else 75
            quality = max(1, min(100, quality))
            
            print()
            compress_batch(input_folder, output_folder, quality)
            
            input('\nTekan Enter untuk kembali ke menu...')
        
        elif choice == '3':
            # Quick mode - compress all in input folder
            print('\n' + '-' * 70)
            print('MODE: Kompresi File di Folder input/')
            print('-' * 70)
            
            input_folder = 'input'
            output_folder = 'output'
            
            pdf_files = get_pdf_files_in_folder(input_folder)
            
            if not pdf_files:
                print(f'\n✗ Tidak ada file PDF di folder {input_folder}/')
                input('\nTekan Enter untuk kembali...')
                continue
            
            print(f'\nDitemukan {len(pdf_files)} file PDF:')
            for i, f in enumerate(pdf_files, 1):
                size = os.path.getsize(os.path.join(input_folder, f))
                print(f'  {i}. {f} ({format_size(size)})')
            
            quality_input = input('\nMasukkan kualitas (1-100, default 75): ').strip()
            quality = int(quality_input) if quality_input.isdigit() else 75
            quality = max(1, min(100, quality))
            
            confirm = input(f'\nKompresi {len(pdf_files)} file dengan kualitas {quality}%? (y/n): ').strip().lower()
            
            if confirm == 'y':
                print()
                compress_batch(input_folder, output_folder, quality)
            else:
                print('\n✗ Dibatalkan')
            
            input('\nTekan Enter untuk kembali ke menu...')
        
        elif choice == '4':
            print('\nTerima kasih telah menggunakan PDF Compressor!')
            break
        
        else:
            print('\n✗ Pilihan tidak valid!')
            input('\nTekan Enter untuk kembali...')


def main():
    """Main function dengan argument parsing"""
    
    # Jika tidak ada argument, jalankan interactive mode
    if len(sys.argv) == 1:
        interactive_mode()
        return
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print_usage()
        return
    
    mode = sys.argv[1]
    
    if mode == '-h' or mode == '--help':
        print_usage()
    
    elif mode == '-s' or mode == '--single':
        # Single file mode
        if len(sys.argv) < 3:
            print('✗ Error: Path input file diperlukan')
            print('Contoh: python compress.py -s input.pdf')
            return
        
        input_path = sys.argv[2]
        output_path = sys.argv[3] if len(sys.argv) > 3 else None
        quality = int(sys.argv[4]) if len(sys.argv) > 4 else 75
        
        compress_single_file(input_path, output_path, quality)
    
    elif mode == '-b' or mode == '--batch':
        # Batch mode
        if len(sys.argv) < 3:
            print('✗ Error: Path folder input diperlukan')
            print('Contoh: python compress.py -b input_folder')
            return
        
        input_folder = sys.argv[2]
        output_folder = sys.argv[3] if len(sys.argv) > 3 else None
        quality = int(sys.argv[4]) if len(sys.argv) > 4 else 75
        
        compress_batch(input_folder, output_folder, quality)
    
    elif mode == '-q' or mode == '--quick':
        # Quick mode - compress all in input folder
        quality = int(sys.argv[2]) if len(sys.argv) > 2 else 75
        compress_batch('input', 'output', quality)
    
    else:
        print(f'✗ Error: Mode tidak dikenal: {mode}')
        print_usage()


def print_usage():
    """Print usage information"""
    print('=' * 70)
    print('PDF COMPRESSOR - Usage')
    print('=' * 70)
    print('\nMode Interaktif (tanpa argument):')
    print('  python compress.py')
    print('\nMode Command Line:')
    print('  1. Single file:')
    print('     python compress.py -s <input.pdf> [output.pdf] [quality]')
    print('     Contoh: python compress.py -s input.pdf output.pdf 75')
    print()
    print('  2. Batch folder:')
    print('     python compress.py -b <input_folder> [output_folder] [quality]')
    print('     Contoh: python compress.py -b input_folder output_folder 75')
    print()
    print('  3. Quick mode (kompresi semua di folder input/):')
    print('     python compress.py -q [quality]')
    print('     Contoh: python compress.py -q 75')
    print()
    print('Parameter:')
    print('  quality: 1-100 (default: 75)')
    print('           Semakin rendah = ukuran lebih kecil, kualitas lebih rendah')
    print('           Semakin tinggi = ukuran lebih besar, kualitas lebih baik')
    print()


if __name__ == "__main__":
    main()
