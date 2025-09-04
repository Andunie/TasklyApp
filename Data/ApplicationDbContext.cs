using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TasklyApp.Models.Entities;

namespace TasklyApp.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions options) : base(options)
    {
    }

    public DbSet<ProjectTask> Tasks { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<Invitation> Invitations { get; set; }
    public DbSet<TaskActivity> TaskActivities { get; set; }
    public DbSet<TaskComment> TaskComments { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); // Identity için bu satır ÇOK ÖNEMLİ!

        // Team ve User arasında çok-a-çok ilişkiyi belirtiyoruz.
        // EF Core 7+ bunu otomatik olarak anlar ama açıkça belirtmek iyi bir pratiktir.
        modelBuilder.Entity<Team>()
            .HasMany(t => t.Members)
            .WithMany(u => u.Teams);

        // Örnek verileri güncelleyebiliriz, ama şimdilik kaldıralım.
        // Migration oluşturduktan sonra eklemek daha temiz olur.

        // --- YENİ VE DOĞRU İLİŞKİ TANIMI ---
        // Team ve User (TeamLeader) arasındaki bire-çok ilişkiyi tanımla
        modelBuilder.Entity<Team>()
            .HasOne(t => t.TeamLeader)         // Bir Takımın BİR tane TeamLeader'ı vardır.
            .WithMany()                        // Bir User'ın (TeamLeader) lideri olduğu birçok takım olabilir.
                                               // User sınıfında karşılık gelen bir koleksiyon olmadığı için WithMany() parantezini boş bırakıyoruz.
            .HasForeignKey(t => t.TeamLeadId)  // Bu ilişki için kullanılacak foreign key 'TeamLeadId'dir.
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProjectTask>()
         .HasMany(p => p.Activities)
         .WithOne(a => a.Task)
         .HasForeignKey(a => a.TaskId)
         .OnDelete(DeleteBehavior.Cascade); // Kademeli Silme

        // 2. Bir TaskActivity silindiğinde, ona bağlı olan TÜM Yorumların da silinmesini sağla.
        modelBuilder.Entity<TaskActivity>()
            .HasMany(a => a.Comments)
            .WithOne(c => c.ParentActivity)
            .HasForeignKey(c => c.ParentActivityId)
            .OnDelete(DeleteBehavior.Cascade); // Kademeli Silme

        // 3. Bir TaskComment (Yorum), kendi altındaki cevapları (Replies) yönetir.
        // Bu ilişki genellikle kendi kendini referans ettiği için EF Core tarafından
        // otomatik olarak yönetilir, ancak açıkça belirtmek daha iyidir.
        modelBuilder.Entity<TaskComment>()
            .HasMany(c => c.Replies)
            .WithOne(c => c.ParentComment)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade); // Bir yorum silinirse, tüm cevapları da silinsin.
    }
}
