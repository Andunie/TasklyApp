namespace TasklyApp.Dtos.Tasks;

public class TaskActivityDto
{
    /// <summary>
    /// Aktivitenin benzersiz kimliği.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Aktivitenin açıklaması.
    /// Örn: "Backend'de auth servisleri yazıldı."
    /// </summary>
    public string Description { get; set; }

    /// <summary>
    /// Aktivitenin oluşturulduğu tarih ve saat.
    /// </summary>
    public DateTime ActivityDate { get; set; }

    /// <summary>
    /// Aktiviteyi oluşturan kullanıcının ID'si.
    /// </summary>
    public string UserId { get; set; }

    /// <summary>
    /// Aktiviteyi oluşturan kullanıcının tam adı.
    /// (Bu bilgi, servis katmanında UserId kullanılarak bulunur ve eklenir.)
    /// </summary>
    public string UserName { get; set; }

    /// <summary>
    /// Aktiviteyi oluşturan kullanıcının profil resminin URL'si.
    /// (İleride eklenebilir)
    /// </summary>
    public string? UserAvatarUrl { get; set; }

    /// <summary>
    /// Bu aktiviteye yapılmış yorumların sayısı.
    /// (Performans için ilk sorguda hesaplanıp eklenebilir.)
    /// </summary>
    public int CommentCount { get; set; }
    /// <summary>
    /// Aktiviteye eklenmiş bir resim URL'si (isteğe bağlı).
    /// </summary>
    public string? ImageUrl { get; set; }
}
