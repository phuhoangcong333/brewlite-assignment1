import { Injectable } from '@nestjs/common'

@Injectable()
export class ProductService {
    // Khai báo mảng 8 món mẫu ở đây
    private products = [
        { id: 1, name: 'Cà phê sữa đá', price: 29000, image: '/image/Picture1.png' },
        { id: 2, name: 'Bạc xỉu', price: 30000, image: '/image/Picture2.png' },
        { id: 3, name: 'Cà phê muối', price: 39000, image: '/image/Picture3.png' },
        { id: 4, name: 'Trà đào', price: 42000, image: '/image/Picture4.png' },
        { id: 5, name: 'Cà phê sữa tươi', price: 35000, image: '/image/Picture5.png' },
        { id: 6, name: 'Capuchino', price: 35000, image: '/image/Picture6.png' },
        { id: 7, name: 'Trà vải', price: 35000, image: '/image/Picture7.png' },
        { id: 8, name: 'Matcha Latte', price: 45000, image: '/image/Picture8.png' },
    ];

    getAllProducts() {
        return this.products;
    }

    getProductById(id: number) {
        return this.products.find(p => p.id === id);
    }
}