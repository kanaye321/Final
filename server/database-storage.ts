import {
  users, assets, components, accessories, licenses, activities, consumables, licenseAssignments,
  type User, type InsertUser, 
  type Asset, type InsertAsset,
  type Activity, type InsertActivity,
  type License, type InsertLicense,
  type Accessory, type InsertAccessory,
  type Component, type InsertComponent,
  type Consumable, type InsertConsumable,
  type LicenseAssignment, type InsertLicenseAssignment,
  AssetStatus, LicenseStatus, AccessoryStatus, ConsumableStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage, AssetStats } from "./storage";
import { sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    // Get the current user if we need to return without updates
    if (Object.keys(updateData).length === 0) {
      return await this.getUser(id);
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getAssetByTag(assetTag: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.assetTag, assetTag));
    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(insertAsset).returning();
    return asset;
  }

  async updateAsset(id: number, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const [deleted] = await db.delete(assets)
      .where(eq(assets.id, id))
      .returning();
    return !!deleted;
  }

  // Component operations
  async getComponents(): Promise<Component[]> {
    try {
      return await db.select().from(components);
    } catch (error) {
      console.error('Error fetching components:', error);
      return [];
    }
  }

  async getComponent(id: number): Promise<Component | undefined> {
    try {
      const [component] = await db.select().from(components).where(eq(components.id, id));
      return component;
    } catch (error) {
      console.error('Error fetching component:', error);
      return undefined;
    }
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    try {
      // Ensure quantity is a number
      const processedComponent = {
        ...insertComponent,
        quantity: typeof insertComponent.quantity === 'string' 
          ? parseInt(insertComponent.quantity) 
          : insertComponent.quantity || 1
      };

      const [component] = await db.insert(components).values(processedComponent).returning();

      // Create activity record
      await this.createActivity({
        action: "create",
        itemType: "component",
        itemId: component.id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Component "${component.name}" created`,
      });

      return component;
    } catch (error) {
      console.error('Error creating component:', error);
      throw error;
    }
  }

  async updateComponent(id: number, updateData: Partial<InsertComponent>): Promise<Component | undefined> {
    try {
      const [component] = await db.select().from(components).where(eq(components.id, id));
      if (!component) return undefined;

      // Convert quantity from string to number if needed
      if (typeof updateData.quantity === 'string') {
        updateData.quantity = parseInt(updateData.quantity);
      }

      const [updated] = await db.update(components)
        .set(updateData)
        .where(eq(components.id, id))
        .returning();

      if (updated) {
        // Create activity record
        await this.createActivity({
          action: "update",
          itemType: "component",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `Component "${component.name}" updated`,
        });
      }

      return updated;
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  async deleteComponent(id: number): Promise<boolean> {
    try {
      const [component] = await db.select().from(components).where(eq(components.id, id));
      if (!component) return false;

      const [deleted] = await db.delete(components)
        .where(eq(components.id, id))
        .returning();

      if (deleted) {
        // Create activity record
        await this.createActivity({
          action: "delete",
          itemType: "component",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `Component "${component.name}" deleted`,
        });
      }

      return !!deleted;
    } catch (error) {
      console.error('Error deleting component:', error);
      return false;
    }
  }

  // Accessory operations
  async getAccessories(): Promise<Accessory[]> {
    return await db.select().from(accessories);
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    return accessory;
  }

  async createAccessory(insertAccessory: InsertAccessory): Promise<Accessory> {
    // Make sure quantity is a number
    const processedAccessory = {
      ...insertAccessory,
      quantity: typeof insertAccessory.quantity === 'string' 
        ? parseInt(insertAccessory.quantity) 
        : insertAccessory.quantity
    };

    const [accessory] = await db.insert(accessories).values(processedAccessory).returning();

    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "accessory",
      itemId: accessory.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Accessory "${accessory.name}" created`,
    });

    return accessory;
  }

  async updateAccessory(id: number, updateData: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    if (!accessory) return undefined;

    // Convert quantity from string to number if needed
    if (typeof updateData.quantity === 'string') {
      updateData.quantity = parseInt(updateData.quantity);
    }

    const [updated] = await db.update(accessories)
      .set(updateData)
      .where(eq(accessories.id, id))
      .returning();

    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" updated`,
      });
    }

    return updated;
  }

  async deleteAccessory(id: number): Promise<boolean> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    if (!accessory) return false;

    const [deleted] = await db.delete(accessories)
      .where(eq(accessories.id, id))
      .returning();

    if (deleted) {
      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" deleted`,
      });
    }

    return !!deleted;
  }

  // Consumable operations
  async getConsumables(): Promise<Consumable[]> {
    try {
      return await db.select().from(consumables);
    } catch (error) {
      console.error('Error fetching consumables:', error);
      return [];
    }
  }

  async getConsumable(id: number): Promise<Consumable | undefined> {
    try {
      const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
      return consumable;
    } catch (error) {
      console.error('Error fetching consumable:', error);
      return undefined;
    }
  }

  async createConsumable(insertConsumable: InsertConsumable): Promise<Consumable> {
    try {
      // Make sure quantity is a number
      const processedConsumable = {
        ...insertConsumable,
        quantity: typeof insertConsumable.quantity === 'string' 
          ? parseInt(insertConsumable.quantity) 
          : insertConsumable.quantity || 1
      };

      const [consumable] = await db.insert(consumables).values(processedConsumable).returning();

      // Create activity record
      await this.createActivity({
        action: "create",
        itemType: "consumable",
        itemId: consumable.id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" created`,
      });

      return consumable;
    } catch (error) {
      console.error('Error creating consumable:', error);
      throw error;
    }
  }

  async updateConsumable(id: number, updateData: Partial<InsertConsumable>): Promise<Consumable | undefined> {
    const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
    if (!consumable) return undefined;

    // Convert quantity from string to number if needed
    if (typeof updateData.quantity === 'string') {
      updateData.quantity = parseInt(updateData.quantity);
    }

    const [updated] = await db.update(consumables)
      .set(updateData)
      .where(eq(consumables.id, id))
      .returning();

    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "consumable",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" updated`,
      });
    }

    return updated;
  }

  async deleteConsumable(id: number): Promise<boolean> {
    try {
      const consumable = await this.getConsumable(id);
      if (!consumable) return false;

      await db.delete(consumables).where(eq(consumables.id, id));

      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "consumable",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" deleted`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting consumable:', error);
      return false;
    }
  }

  async getConsumableAssignments(consumableId: number): Promise<any[]> {
    // For now, return empty array since we don't have a consumable assignments table
    // In a real implementation, you would query a consumable_assignments table
    return [];
  }

  async assignConsumable(consumableId: number, assignmentData: any): Promise<any> {
    // For now, just create an activity record
    // In a real implementation, you would insert into a consumable_assignments table
    await this.createActivity({
      action: "checkout",
      itemType: "consumable",
      itemId: consumableId,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Consumable assigned to ${assignmentData.assignedTo}`,
    });

    return {
      id: Date.now(),
      assignedTo: assignmentData.assignedTo,
      serialNumber: assignmentData.serialNumber,
      knoxId: assignmentData.knoxId,
      notes: assignmentData.notes,
      assignedDate: new Date().toISOString(),
    };
  }

  // License operations
  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses);
  }

  async getLicense(id: number): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(insertLicense).returning();

    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "license",
      itemId: license.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License "${license.name}" created`,
    });

    return license;
  }

  async updateLicense(id: number, updateData: Partial<InsertLicense>): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!license) return undefined;

    const [updated] = await db.update(licenses)
      .set(updateData)
      .where(eq(licenses.id, id))
      .returning();

    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "license",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `License "${license.name}" updated`,
      });
    }

    return updated;
  }

  async deleteLicense(id: number): Promise<boolean> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!license) return false;

    try {
      // First delete all license assignments related to this license
      await db.delete(licenseAssignments)
        .where(eq(licenseAssignments.licenseId, id));

      // Then delete the license
      const [deleted] = await db.delete(licenses)
        .where(eq(licenses.id, id))
        .returning();

      if (deleted) {
        // Create activity record
        await this.createActivity({
          action: "delete",
          itemType: "license",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `License "${license.name}" deleted`,
        });
      }

      return !!deleted;
    } catch (error) {
      console.error("Error deleting license:", error);
      throw error;
    }
  }

  // License assignment operations
  async getLicenseAssignments(licenseId: number): Promise<LicenseAssignment[]> {
    return await db.select()
      .from(licenseAssignments)
      .where(eq(licenseAssignments.licenseId, licenseId))
      .orderBy(licenseAssignments.assignedDate);
  }

  async createLicenseAssignment(insertAssignment: InsertLicenseAssignment): Promise<LicenseAssignment> {
    const [assignment] = await db
      .insert(licenseAssignments)
      .values(insertAssignment)
      .returning();

    // Create activity record
    await this.createActivity({
      action: "update",
      itemType: "license",
      itemId: insertAssignment.licenseId,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License seat assigned to: ${insertAssignment.assignedTo}`,
    });

    return assignment;
  }

  // Checkout/checkin operations
  async checkoutAsset(assetId: number, userId: number, expectedCheckinDate?: string, customNotes?: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!asset || !user) return undefined;
    if (asset.status !== AssetStatus.AVAILABLE) return undefined;

    const today = new Date().toISOString().split("T")[0];

    const [updatedAsset] = await db.update(assets)
      .set({
        status: AssetStatus.DEPLOYED,
        assignedTo: userId,
        checkoutDate: today,
        expectedCheckinDate: expectedCheckinDate || null,
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (updatedAsset) {
      // Create activity record
      await this.createActivity({
        action: "checkout",
        itemType: "asset",
        itemId: assetId,
        userId,
        timestamp: new Date().toISOString(),
        notes: customNotes || `Asset ${asset.name} (${asset.assetTag}) checked out to ${user.firstName} ${user.lastName}`,
      });
    }

    return updatedAsset;
  }

  async checkinAsset(assetId: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));

    if (!asset) return undefined;
    if (asset.status !== AssetStatus.DEPLOYED && asset.status !== AssetStatus.OVERDUE) return undefined;

    const [updatedAsset] = await db.update(assets)
      .set({
        status: AssetStatus.AVAILABLE,
        assignedTo: null,
        checkoutDate: null,
        expectedCheckinDate: null,
        knoxId: null, // Clear the Knox ID when checking in
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (updatedAsset) {
      // Create activity record
      await this.createActivity({
        action: "checkin",
        itemType: "asset",
        itemId: assetId,
        userId: asset.assignedTo,
        timestamp: new Date().toISOString(),
        notes: `Asset ${asset.name} (${asset.assetTag}) checked in`,
      });
    }

    return updatedAsset;
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    // Order by timestamp descending for newest first
    return await db.select()
      .from(activities)
      .orderBy(activities.timestamp);
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(activities.timestamp);
  }

  async getActivitiesByAsset(assetId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.itemId, assetId))
      .orderBy(activities.timestamp);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Stats and summaries
  async getAssetStats(): Promise<AssetStats> {
    const allAssets = await db.select().from(assets);

    return {
      total: allAssets.length,
      checkedOut: allAssets.filter(asset => asset.status === AssetStatus.DEPLOYED).length,
      available: allAssets.filter(asset => asset.status === AssetStatus.AVAILABLE).length,
      pending: allAssets.filter(asset => asset.status === AssetStatus.PENDING).length,
      overdue: allAssets.filter(asset => asset.status === AssetStatus.OVERDUE).length,
      archived: allAssets.filter(asset => asset.status === AssetStatus.ARCHIVED).length,
    };
  }

  // Zabbix settings operations (stub implementations for now)
  async getZabbixSettings(): Promise<any> {
    return undefined;
  }

  async saveZabbixSettings(settings: any): Promise<any> {
    return settings;
  }

  // Zabbix subnet operations (stub implementations)
  async getZabbixSubnets(): Promise<any[]> {
    return [];
  }

  async getZabbixSubnet(id: number): Promise<any> {
    return undefined;
  }

  async createZabbixSubnet(subnet: any): Promise<any> {
    return subnet;
  }

  async deleteZabbixSubnet(id: number): Promise<boolean> {
    return true;
  }

  // VM monitoring operations (stub implementations)
  async getVMMonitoring(): Promise<any[]> {
    return [];
  }

  async getVMMonitoringByVMId(vmId: number): Promise<any> {
    return undefined;
  }

  async createVMMonitoring(monitoring: any): Promise<any> {
    return monitoring;
  }

  async updateVMMonitoring(id: number, monitoring: any): Promise<any> {
    return monitoring;
  }

  // Discovered hosts operations (stub implementations)
  async getDiscoveredHosts(): Promise<any[]> {
    return [];
  }

  async getDiscoveredHost(id: number): Promise<any> {
    return undefined;
  }

  async createDiscoveredHost(host: any): Promise<any> {
    return host;
  }

  async updateDiscoveredHost(id: number, host: any): Promise<any> {
    return host;
  }

  async deleteDiscoveredHost(id: number): Promise<boolean> {
    return true;
  }

  // BitLocker keys operations (stub implementations)
  async getBitlockerKeys(): Promise<any[]> {
    return [];
  }

  async getBitlockerKey(id: number): Promise<any> {
    return undefined;
  }

  async getBitlockerKeyBySerialNumber(serialNumber: string): Promise<any[]> {
    return [];
  }

  async getBitlockerKeyByIdentifier(identifier: string): Promise<any[]> {
    return [];
  }

  async createBitlockerKey(key: any): Promise<any> {
    return key;
  }

  async updateBitlockerKey(id: number, key: any): Promise<any> {
    return key;
  }

  async deleteBitlockerKey(id: number): Promise<boolean> {
    return true;
  }

  // VM Inventory operations - using in-memory storage for now since there's no VM table in schema
  private vmInventoryData = new Map<number, any>();
  private vmInventoryIdCounter = 1;

  async getVmInventory(): Promise<any[]> {
    return Array.from(this.vmInventoryData.values());
  }

  async getVmInventoryItem(id: number): Promise<any> {
    return this.vmInventoryData.get(id);
  }

  async createVmInventoryItem(vm: any): Promise<any> {
    const newVM = {
      id: this.vmInventoryIdCounter++,
      ...vm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.vmInventoryData.set(newVM.id, newVM);

    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "vm",
      itemId: newVM.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `VM "${newVM.vmName}" created`,
    });

    return newVM;
  }

  async updateVmInventoryItem(id: number, vm: any): Promise<any> {
    const existingVM = this.vmInventoryData.get(id);
    if (!existingVM) return undefined;

    const updatedVM = {
      ...existingVM,
      ...vm,
      id, // Keep the original ID
      updatedAt: new Date().toISOString()
    };

    this.vmInventoryData.set(id, updatedVM);

    // Create activity record
    await this.createActivity({
      action: "update",
      itemType: "vm",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `VM "${updatedVM.vmName}" updated`,
    });

    return updatedVM;
  }

  async deleteVmInventoryItem(id: number): Promise<boolean> {
    const vm = this.vmInventoryData.get(id);
    if (!vm) return false;

    const result = this.vmInventoryData.delete(id);

    if (result) {
      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "vm",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `VM "${vm.vmName}" deleted`,
      });
    }

    return result;
  }
}

export async function initializeDatabase() {
  try {
    // Connect to the database
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection established");

    // Check if tables exist before attempting to create them
    const usersTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);

    const assetsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'assets'
      );
    `);

    const componentsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'components'
      );
    `);

    const accessoriesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'accessories'
      );
    `);

    const consumablesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'consumables'
      );
    `);

    const licensesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'licenses'
      );
    `);

    const licenseAssignmentsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'license_assignments'
      );
    `);

    const activitiesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'activities'
      );
    `);

    const vmInventoryTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'vm_inventory'
      );
    `);

    const vmsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'vms'
      );
    `);

    const consumableAssignmentsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'consumable_assignments'
      );
    `);

    // Initialize tables
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          department TEXT,
          is_admin BOOLEAN DEFAULT false,
          role_id INTEGER,
          permissions JSON DEFAULT '{"assets":{"view":true,"edit":false,"add":false},"components":{"view":true,"edit":false,"add":false},"accessories":{"view":true,"edit":false,"add":false},"consumables":{"view":true,"edit":false,"add":false},"licenses":{"view":true,"edit":false,"add":false},"users":{"view":false,"edit":false,"add":false},"reports":{"view":true,"edit":false,"add":false},"vmMonitoring":{"view":true,"edit":false,"add":false},"networkDiscovery":{"view":true,"edit":false,"add":false},"bitlockerKeys":{"view":false,"edit":false,"add":false},"admin":{"view":false,"edit":false,"add":false}}'
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS assets (
          id SERIAL PRIMARY KEY,
          asset_tag TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          asset_type TEXT,
          model_id INTEGER,
          serial_number TEXT,
          status TEXT NOT NULL DEFAULT 'available',
          assigned_to INTEGER REFERENCES users(id),
          location TEXT,
          notes TEXT,
          purchase_date TEXT,
          purchase_cost TEXT,
          warranty_months INTEGER,
          invoice_number TEXT,
          supplier TEXT,
          requestable BOOLEAN DEFAULT true,
          knox_id TEXT,
          checkout_date TEXT,
          expected_checkin_date TEXT
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS components (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
          serial TEXT,
          location TEXT,
          notes TEXT,
          quantity INTEGER DEFAULT 1,
          min_quantity INTEGER DEFAULT 1,
          purchase_date TEXT,
          purchase_cost TEXT,
          order_number TEXT,
          manufacturer TEXT
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS accessories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          accessory_type TEXT,
          serial TEXT,
          location TEXT,
          notes TEXT,
          quantity INTEGER DEFAULT 1,
          min_quantity INTEGER DEFAULT 1,
          purchase_date TEXT,
          purchase_cost TEXT,
          order_number TEXT,
          manufacturer TEXT
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS consumables (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          item_no TEXT,
          location TEXT,
          notes TEXT,
          quantity INTEGER DEFAULT 1,
          min_quantity INTEGER DEFAULT 1,
          purchase_date TEXT,
          purchase_cost TEXT,
          order_number TEXT,
          manufacturer TEXT
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS licenses (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          product_key TEXT,
          seats INTEGER,
          licensed_to TEXT,
          license_email TEXT,
          reassignable BOOLEAN DEFAULT true,
          notes TEXT,
          purchase_date TEXT,
          purchase_cost TEXT,
          order_number TEXT,
          manufacturer TEXT,
          expiry_date TEXT
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS license_assignments (
          id SERIAL PRIMARY KEY,
          license_id INTEGER NOT NULL REFERENCES licenses(id),
          asset_id INTEGER REFERENCES assets(id),
          assigned_to TEXT NOT NULL,
          serial_number TEXT,
          notes TEXT,
          assigned_date TEXT NOT NULL
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          action TEXT NOT NULL,
          item_type TEXT NOT NULL,
          item_id INTEGER NOT NULL,
          user_id INTEGER REFERENCES users(id),
          timestamp TEXT NOT NULL,
          notes TEXT
        );
      `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS vm_inventory (
          id SERIAL PRIMARY KEY,
          vm_name TEXT NOT NULL,
          host_name TEXT NOT NULL,
          guest_os TEXT NOT NULL,
          power_state TEXT NOT NULL,
          cpu_count INTEGER,
          memory_mb INTEGER,
          disk_gb INTEGER,
          ip_address TEXT,
          mac_address TEXT,
          vmware_tools TEXT,
          cluster TEXT,
          datastore TEXT,
          created_date TEXT,
          last_modified TEXT,
          notes TEXT
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS vms (
          id SERIAL PRIMARY KEY,
          vm_name TEXT NOT NULL,
          host_name TEXT NOT NULL,
          guest_os TEXT NOT NULL,
          power_state TEXT NOT NULL DEFAULT 'stopped',
          cpu_count INTEGER DEFAULT 1,
          memory_mb INTEGER DEFAULT 1024,
          disk_gb INTEGER DEFAULT 20,
          ip_address TEXT,
          mac_address TEXT,
          vmware_tools TEXT,
          cluster TEXT,
          datastore TEXT,
          status TEXT NOT NULL DEFAULT 'available',
          assigned_to INTEGER REFERENCES users(id),
          location TEXT,
          serial_number TEXT,
          model TEXT,
          manufacturer TEXT,
          purchase_date TEXT,
          purchase_cost TEXT,
          department TEXT,
          description TEXT,
          created_date TEXT DEFAULT '${new Date().toISOString()}',
          last_modified TEXT DEFAULT '${new Date().toISOString()}',
          notes TEXT
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS consumable_assignments (
          id SERIAL PRIMARY KEY,
          consumable_id INTEGER NOT NULL REFERENCES consumables(id),
          assigned_to TEXT NOT NULL,
          serial_number TEXT,
          knox_id TEXT,
          quantity INTEGER NOT NULL DEFAULT 1,
          assigned_date TEXT NOT NULL,
          returned_date TEXT,
          status TEXT NOT NULL DEFAULT 'assigned',
          notes TEXT
        );
      `);

    console.log("✅ All tables created/verified");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}