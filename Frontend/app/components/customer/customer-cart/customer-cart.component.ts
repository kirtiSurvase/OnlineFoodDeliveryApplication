import { Component, OnInit } from '@angular/core';
import { Cart } from '../../model/cart.model';
import { forkJoin, take } from 'rxjs';
import { OnlinefoodService } from '../../service/onlinefood.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import * as _ from "lodash";

@Component({
  standalone:false,
  selector: 'app-customer-cart',
  templateUrl: './customer-cart.component.html',
  styleUrls: ['./customer-cart.component.css']
})
export class CustomerCartComponent implements OnInit {
  cartList: Cart[] = [];
  cartListBackup: Cart[] = [];
  grandTotal: number = 0;
  customer: any = {};


  constructor(
    private oService: OnlinefoodService,
    private router: Router,
    private datePipe: DatePipe
  ) {
    this.oService.isCustomerLoginPresent();
    this.getCartList();
    this.getCustomerDetail();
  }

  ngOnInit(): void {
  }
  getCartList(): void {
    this.oService.cartList().pipe(take(1)).subscribe(
      (res: any) => {
        console.log("********", res);
        if (!!res && Array.isArray(res)) {
          const customerFilter = res.filter((item: Cart)=> item?.customer?.customerId === parseInt(this.oService.getCustomerAuthorization()));
          console.log("customer filter::::::",customerFilter);
          this.cartList = customerFilter;
          this.cartListBackup = _.cloneDeep(customerFilter);
          if (this.cartList.length > 0) {
            this.cartList.map((item: Cart) => {
              this.grandTotal += (item?.mrpPrice * item?.quantity);
            })
          }
        }
      }, err => {
        console.log("error");
      }

    );
  }
  getTotal(quantity: number = 0, mrpPrice: number = 0): number {
    return quantity * mrpPrice;
  }
  placeOrder(): void {
    const req:any[]=[];
    this.cartList.map((item: Cart) => {
      const body: any = {
        mrpPrice: item?.mrpPrice,
        quantity: item?.quantity,
        totalPrice: item?.mrpPrice * item?.quantity,
        orderStatus: "success",
        paymentStatus: "success",
        orderedDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
        customer: this.customer,
        cart: item,
        productname: item?.product?.productname,
        image: item?.product?.image
      };
     
      console.log("add to order", body);
      req.push(this.oService.placeOrder(this.customer?.customerId, item?.cartId, body));
    
    });

     forkJoin(req).pipe(take(1)).subscribe(
        (res: any) => {
          console.log("PLaceorder$$$$$$$$",res);
          alert("Place order Sucessfully");
          this.router.navigate(["/client/order"])

        }, err => {
          console.log("Error");
        });


  }
  getCustomerDetail(): void {
    const cid = this.oService.getCustomerAuthorization();
    this.oService.getCustomerById(cid).pipe(take(1)).subscribe(
      (res: any) => {
        console.log("Customer*****", res);
        if (!!res && res?.customerId) {
          this.customer = res;
        }
      }, err => {
        console.log("Err");
      }
    )
  }

  deleteCart(cart:Cart, showAlert: boolean = true):void{
    this.oService.deleteCart(cart?.cartId).pipe(take(1)).subscribe(
      (res: any) => {
        if (showAlert) {
          alert("Product deleted sucessfully");
        }
       
        this.getCartList();
      }, err => {
        console.log("Err");
      }
    )
  }

  onIncreaseQunatity(cart: Cart): void {
    const index = this.cartList.findIndex((item: Cart) => item.cartId === cart?.cartId);
    // const bac = Object.assign(this.cartListBackup);
    const indexBackup = this.cartListBackup.findIndex((item: Cart) => item.cartId === cart?.cartId);
    const qty = cart.quantity + 1;
    console.log( this.cartListBackup[indexBackup].quantity , '>>>>>>' , (cart.product?.quantity ))
    if (qty > (cart.product?.quantity  + this.cartListBackup[indexBackup].quantity) ) {
      alert('Added quantity should not greater than avaiable quantity');
      return;
    }
    this.cartList[index].quantity = qty;
    this.updateGrantTotal();
  }

  onDecreaseQunatity(cart: Cart): void {
    const index = this.cartList.findIndex((item: Cart) => item.cartId === cart?.cartId);
    const qty = cart.quantity - 1;
    if (qty === 0) {
      this.deleteCart(cart, false);
    }
    this.cartList[index].quantity = qty;
    this.updateGrantTotal();
  }

  updateGrantTotal(): void {
    let total = 0;
    this.cartList.map((item: Cart) => {
      total+= (item?.mrpPrice * item?.quantity);
     
    })
    this.grandTotal = total;
  }

}
