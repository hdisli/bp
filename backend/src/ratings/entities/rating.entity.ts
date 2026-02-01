import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../entities/user.entity';

@Entity('ratings')
@Unique('uq_ratings_product_user', ['productId', 'userId'])
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  @Index('idx_ratings_product_id')
  productId: number;

  @Column({ name: 'user_id' })
  @Index('idx_ratings_user_id')
  userId: number;

  @Column({
    name: 'price_performance',
    type: 'decimal',
    precision: 4,
    scale: 2,
  })
  pricePerformance: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  quality: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  ingredients: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  packaging: number;

  @Column({
    name: 'product_rating',
    type: 'decimal',
    precision: 4,
    scale: 2,
  })
  productRating: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
